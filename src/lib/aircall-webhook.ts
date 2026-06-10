import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

/**
 * Aircall sends an HMAC-SHA1 signature in the `X-Aircall-Signature` header.
 * The secret is a per-webhook token shown in the dashboard at install time —
 * NOT the workspace API token. We store it as `AIRCALL_WEBHOOK_TOKEN`, with a
 * fallback to `AIRCALL_API_TOKEN` so the smoke tests we wrote before the
 * dashboard confirmation still work locally.
 */
export function verifyAircallSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature) return false;
  const secret =
    process.env.AIRCALL_WEBHOOK_TOKEN || process.env.AIRCALL_API_TOKEN;
  if (!secret) return false;
  const expected = createHmac("sha1", secret).update(rawBody).digest("hex");
  // Constant-time compare; lengths must match or timingSafeEqual throws.
  const a = Buffer.from(expected);
  const b = Buffer.from(signature.trim());
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Aircall also embeds the same per-webhook token inside the payload as
 * `payload.token`. Comparing it against our expected value is a cheap
 * second line of defence if the HMAC ever gets misconfigured.
 */
export function expectedPayloadToken(): string | null {
  return process.env.AIRCALL_WEBHOOK_TOKEN ?? null;
}

// ── Webhook payload shape ───────────────────────────────────────────────────

export type AircallWebhookEvent =
  | "call.created"
  | "call.ringing_on_agent"
  | "call.answered"
  | "call.hungup"
  | "call.ended"
  | "call.voicemail_left"
  | "call.commented"
  | "call.tagged"
  | "call.untagged"
  | "call.assigned"
  | "call.comm_assets_generated"
  | "contact.created"
  | "contact.updated"
  | "contact.deleted";

export type AircallWebhookCallData = {
  id: number;
  direct_link?: string;
  direction: "inbound" | "outbound";
  status?: "initial" | "answered" | "done";
  missed_call_reason?: string | null;
  started_at: number; // unix seconds
  answered_at?: number | null;
  ended_at?: number | null;
  duration?: number | null;
  raw_digits?: string;
  voicemail?: string | null;
  recording?: string | null;
  asset?: string | null;
  user?: { id: number; name: string; email: string } | null;
  number?: { id: number; digits: string; name: string } | null;
  contact?: { id: number; first_name: string | null; last_name: string | null } | null;
};

export type AircallWebhookPayload = {
  event: AircallWebhookEvent;
  timestamp: number;
  resource: string;
  token?: string;
  data: AircallWebhookCallData & Record<string, unknown>;
};

export function parseWebhookBody(raw: string): AircallWebhookPayload | null {
  try {
    const obj = JSON.parse(raw) as AircallWebhookPayload;
    if (!obj.event || !obj.data || typeof obj.data.id !== "number") return null;
    return obj;
  } catch {
    return null;
  }
}

export function newCallRowId(): string {
  return `call_${randomUUID().slice(0, 8)}`;
}
