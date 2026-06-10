import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  newCallRowId,
  parseWebhookBody,
  verifyAircallSignature,
  type AircallWebhookCallData,
  type AircallWebhookPayload,
} from "@/lib/aircall-webhook";
import { matchKey } from "@/lib/phone";
import {
  recordingStorageAvailable,
  storeRecordingForCall,
} from "@/lib/recordings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Aircall webhook ingester.
 *
 * - HMAC-SHA1 signature verify on the raw body (X-Aircall-Signature).
 * - Idempotent: UNIQUE(aircall_call_id) prevents duplicates from retries.
 * - On `call.ended` / `call.comm_assets_generated` we persist the call,
 *   try to attach a CRM person by phone match, and mirror the recording
 *   into Vercel Blob since Aircall's URL expires in ~10 minutes.
 *
 * The handler always returns 200 once the signature is valid — Aircall
 * disables webhooks after 10 consecutive non-2xx responses, so we
 * swallow processing errors after logging them.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-aircall-signature");

  if (!verifyAircallSignature(raw, signature)) {
    return NextResponse.json(
      { error: "invalid signature" },
      { status: 401 },
    );
  }

  const payload = parseWebhookBody(raw);
  if (!payload) {
    return NextResponse.json({ error: "malformed payload" }, { status: 400 });
  }

  try {
    await handleEvent(payload);
  } catch (err) {
    console.error("[aircall] handler failed", payload.event, err);
    // Acknowledge so Aircall doesn't disable the webhook for transient
    // failures. Real retries are driven by us re-fetching `/v1/calls/:id`.
  }

  return NextResponse.json({ ok: true });
}

async function handleEvent(payload: AircallWebhookPayload): Promise<void> {
  switch (payload.event) {
    case "call.ended":
    case "call.comm_assets_generated":
      await upsertCall(payload.data);
      return;

    // Other events (`call.created`, `call.answered`, etc.) arrive before we
    // have a recording or final duration; we ignore them for now and let
    // `call.ended` be the source of truth. Easy to add later if we want
    // real-time progress indicators.
    default:
      return;
  }
}

async function upsertCall(data: AircallWebhookCallData): Promise<void> {
  const db = await getDb();

  const startedAt = new Date(data.started_at * 1000).toISOString();
  const answeredAt = data.answered_at
    ? new Date(data.answered_at * 1000).toISOString()
    : null;
  const endedAt = data.ended_at ? new Date(data.ended_at * 1000).toISOString() : null;
  const durationSec = data.duration ?? 0;
  const rawDigits = data.raw_digits ?? null;
  const e164 = rawDigits ? rawDigits.replace(/\s/g, "") : null;

  const status: "done" | "missed" | "voicemail" = data.voicemail
    ? "voicemail"
    : data.missed_call_reason
      ? "missed"
      : "done";

  const aircallUserId = data.user?.id ?? null;
  const sdrId = aircallUserId ? await findSdrIdByAircallUser(aircallUserId) : null;
  const personId = rawDigits ? await findPersonByPhone(rawDigits) : null;
  const taskId =
    sdrId && personId ? await findOpenCallTask(sdrId, personId) : null;

  const recordingUrl = data.recording ?? data.asset ?? null;
  const recordingStatus = recordingUrl ? "pending" : "none";

  // Insert first with the volatile Aircall URL; we'll patch in the permanent
  // Blob URL once the upload completes below.
  await db.execute({
    sql: `INSERT OR IGNORE INTO calls (
            id, aircall_call_id, direction, raw_digits, e164,
            started_at, answered_at, ended_at, duration_sec, status,
            recording_url, recording_status,
            aircall_user_id, sdr_id, person_id, task_id, note,
            raw_payload, created_at
          ) VALUES (
            :id, :aircall_call_id, :direction, :raw_digits, :e164,
            :started_at, :answered_at, :ended_at, :duration_sec, :status,
            :recording_url, :recording_status,
            :aircall_user_id, :sdr_id, :person_id, :task_id, NULL,
            :raw_payload, :created_at
          )`,
    args: {
      id: newCallRowId(),
      aircall_call_id: data.id,
      direction: data.direction,
      raw_digits: rawDigits,
      e164,
      started_at: startedAt,
      answered_at: answeredAt,
      ended_at: endedAt,
      duration_sec: durationSec,
      status,
      recording_url: recordingUrl,
      recording_status: recordingStatus,
      aircall_user_id: aircallUserId,
      sdr_id: sdrId,
      person_id: personId,
      task_id: taskId,
      raw_payload: JSON.stringify(data),
      created_at: new Date().toISOString(),
    },
  });

  // If we already had this call from `call.ended` and now `call.comm_assets_generated`
  // delivered the recording, top up the recording fields.
  if (recordingUrl) {
    await db.execute({
      sql: `UPDATE calls
            SET recording_url = COALESCE(recording_url, ?),
                recording_status = CASE WHEN recording_status = 'stored' THEN 'stored' ELSE 'pending' END
            WHERE aircall_call_id = ?`,
      args: [recordingUrl, data.id],
    });

    if (recordingStorageAvailable()) {
      try {
        const permanentUrl = await storeRecordingForCall(data.id, recordingUrl);
        await db.execute({
          sql: "UPDATE calls SET recording_url = ?, recording_status = 'stored' WHERE aircall_call_id = ?",
          args: [permanentUrl, data.id],
        });
      } catch (err) {
        console.error("[aircall] recording mirror failed", data.id, err);
        await db.execute({
          sql: "UPDATE calls SET recording_status = 'failed' WHERE aircall_call_id = ?",
          args: [data.id],
        });
      }
    }
  }
}

async function findSdrIdByAircallUser(aircallUserId: number): Promise<string | null> {
  const db = await getDb();
  const r = await db.execute({
    sql: "SELECT id FROM users WHERE aircall_user_id = ? LIMIT 1",
    args: [aircallUserId],
  });
  const row = r.rows[0] as unknown as { id: string } | undefined;
  return row?.id ?? null;
}

/**
 * Try to match an incoming/outgoing phone number to a CRM contact.
 * SQLite has no native phone normalisation, so we compare the trailing
 * 9 digits — enough to match within a country without false positives.
 */
async function findPersonByPhone(rawDigits: string): Promise<string | null> {
  const key = matchKey(rawDigits);
  if (!key) return null;
  const db = await getDb();
  // Strip non-digits from people.phone, take the trailing 9, compare.
  const r = await db.execute({
    sql: `SELECT id FROM people
          WHERE phone IS NOT NULL
            AND substr(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', ''), '+', ''),
                       -9) = ?
          ORDER BY (last_contacted_at IS NULL) ASC, last_contacted_at DESC
          LIMIT 1`,
    args: [key],
  });
  const row = r.rows[0] as unknown as { id: string } | undefined;
  return row?.id ?? null;
}

async function findOpenCallTask(
  sdrId: string,
  personId: string,
): Promise<string | null> {
  const db = await getDb();
  const r = await db.execute({
    sql: `SELECT id FROM tasks
          WHERE sdr_id = ? AND person_id = ? AND channel = 'call' AND status = 'pending'
          ORDER BY due_date ASC
          LIMIT 1`,
    args: [sdrId, personId],
  });
  const row = r.rows[0] as unknown as { id: string } | undefined;
  return row?.id ?? null;
}
