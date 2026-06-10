import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "./db";
import { AircallError, type AircallCall } from "./aircall";
import { storeRecordingForCall, recordingStorageAvailable } from "./recordings";

const BASE = "https://api.aircall.io/v1";

function basicAuth(): string {
  const id = process.env.AIRCALL_API_ID;
  const token = process.env.AIRCALL_API_TOKEN;
  if (!id || !token) throw new Error("AIRCALL_API_ID/AIRCALL_API_TOKEN missing");
  return "Basic " + Buffer.from(`${id}:${token}`).toString("base64");
}

export type SyncResult = {
  fetched: number;
  inserted: number;
  recordingsStored: number;
  recordingsFailed: number;
  recordingsPending: number;
  storageAvailable: boolean;
  windowFrom: string;
  windowTo: string;
};

function newCallRowId(): string {
  return `call_${randomUUID().slice(0, 8)}`;
}

/**
 * Pull recent calls from Aircall and upsert into our `calls` table. Sliding
 * window driven by the highest `started_at` we've already seen, with a 24h
 * safety overlap so a Aircall delivery lag can't drop calls between runs.
 *
 * Designed to be idempotent: `INSERT OR IGNORE` on `aircall_call_id` keeps
 * duplicate runs cheap. The polling cadence is set by Vercel Cron in
 * vercel.json (every 5 min in production).
 */
export async function syncRecentCalls(): Promise<SyncResult> {
  const db = await getDb();

  // Anchor: max started_at we already have, minus 24h overlap. On first run
  // (empty table) we go back 30 days as a conservative initial backfill.
  const anchorR = await db.execute(
    "SELECT MAX(started_at) AS max_started FROM calls",
  );
  const maxStarted =
    (anchorR.rows[0] as unknown as { max_started: string | null } | undefined)
      ?.max_started ?? null;

  const now = Date.now();
  const overlapMs = 24 * 60 * 60 * 1000;
  const initialBackfillMs = 30 * 24 * 60 * 60 * 1000;
  const fromMs = maxStarted
    ? Math.max(0, new Date(maxStarted).getTime() - overlapMs)
    : now - initialBackfillMs;

  const fromUnix = Math.floor(fromMs / 1000);
  const toUnix = Math.floor(now / 1000);

  let inserted = 0;
  let fetched = 0;
  let recordingsStored = 0;
  let recordingsFailed = 0;

  // Aircall paginates at 50/page max; loop until we exhaust the window.
  let page = 1;
  // Safety cap so a misconfiguration can't accidentally walk the entire
  // workspace history in a single cron tick.
  const maxPages = 20;

  while (page <= maxPages) {
    const url = new URL(BASE + "/calls");
    url.searchParams.set("per_page", "50");
    url.searchParams.set("order", "asc");
    url.searchParams.set("from", String(fromUnix));
    url.searchParams.set("to", String(toUnix));
    url.searchParams.set("page", String(page));

    const res = await fetch(url, {
      headers: { Authorization: basicAuth() },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new AircallError(
        `Aircall GET /calls → ${res.status}`,
        res.status,
        await res.text().catch(() => ""),
      );
    }
    const body = (await res.json()) as {
      calls: AircallCall[];
      meta: { next_page_link: string | null };
    };
    fetched += body.calls.length;

    for (const c of body.calls) {
      const wasInserted = await upsertCallRow(c);
      if (wasInserted) inserted++;

      // Mirror the recording if we have storage configured and we just
      // inserted (or recovered from a previous failure).
      const recordingUrl = c.recording ?? c.asset ?? null;
      if (recordingUrl && recordingStorageAvailable()) {
        const needsUpload = await callNeedsRecordingUpload(c.id);
        if (needsUpload) {
          try {
            const permanent = await storeRecordingForCall(c.id, recordingUrl);
            await db.execute({
              sql: "UPDATE calls SET recording_url = ?, recording_status = 'stored' WHERE aircall_call_id = ?",
              args: [permanent, c.id],
            });
            recordingsStored++;
          } catch (err) {
            const reason = err instanceof Error ? err.message : String(err);
            console.error(
              "[aircall sync] recording upload failed",
              { aircallCallId: c.id, reason },
            );
            await db.execute({
              sql: "UPDATE calls SET recording_status = 'failed' WHERE aircall_call_id = ?",
              args: [c.id],
            });
            recordingsFailed++;
          }
        }
      }
    }

    if (!body.meta.next_page_link) break;
    page++;
  }

  const pendingR = await db.execute(
    "SELECT count(*) AS n FROM calls WHERE recording_status = 'pending'",
  );
  const recordingsPending = Number(
    (pendingR.rows[0] as unknown as { n: number } | undefined)?.n ?? 0,
  );

  return {
    fetched,
    inserted,
    recordingsStored,
    recordingsFailed,
    recordingsPending,
    storageAvailable: recordingStorageAvailable(),
    windowFrom: new Date(fromMs).toISOString(),
    windowTo: new Date(now).toISOString(),
  };
}

async function upsertCallRow(c: AircallCall): Promise<boolean> {
  if (!c.ended_at) return false; // call still in flight, skip
  const db = await getDb();
  const rawDigits = c.raw_digits ?? null;
  const e164 = rawDigits ? rawDigits.replace(/\s/g, "") : null;
  const status: "done" | "missed" | "voicemail" = c.voicemail
    ? "voicemail"
    : c.missed_call_reason
      ? "missed"
      : "done";
  const aircallUserId = c.user?.id ?? null;
  const recordingUrl = c.recording ?? c.asset ?? null;
  const recordingStatus = recordingUrl ? "pending" : "none";

  const sdrId = aircallUserId ? await findSdrIdByAircallUser(aircallUserId) : null;
  const personId = rawDigits ? await findPersonByPhone(rawDigits) : null;

  const r = await db.execute({
    sql: `INSERT OR IGNORE INTO calls (
            id, aircall_call_id, direction, raw_digits, e164,
            started_at, answered_at, ended_at, duration_sec, status,
            recording_url, recording_status,
            aircall_user_id, sdr_id, person_id, task_id, note,
            raw_payload, created_at
          ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?,
            ?, ?, ?, NULL, NULL,
            ?, ?
          )`,
    args: [
      newCallRowId(),
      c.id,
      c.direction,
      rawDigits,
      e164,
      new Date(c.started_at * 1000).toISOString(),
      c.answered_at ? new Date(c.answered_at * 1000).toISOString() : null,
      new Date(c.ended_at * 1000).toISOString(),
      c.duration ?? 0,
      status,
      recordingUrl,
      recordingStatus,
      aircallUserId,
      sdrId,
      personId,
      JSON.stringify(c),
      new Date().toISOString(),
    ],
  });
  return r.rowsAffected > 0;
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

async function findPersonByPhone(rawDigits: string): Promise<string | null> {
  const digits = rawDigits.replace(/\D/g, "");
  if (!digits) return null;
  const key = digits.length > 9 ? digits.slice(-9) : digits;
  const db = await getDb();
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

async function callNeedsRecordingUpload(aircallCallId: number): Promise<boolean> {
  const db = await getDb();
  const r = await db.execute({
    sql: "SELECT recording_status FROM calls WHERE aircall_call_id = ? LIMIT 1",
    args: [aircallCallId],
  });
  const row = r.rows[0] as unknown as { recording_status: string } | undefined;
  return row?.recording_status === "pending" || row?.recording_status === "failed";
}
