import "server-only";

/**
 * Thin REST client for the Aircall Public API. Basic Auth (api_id:api_token),
 * single-tenant: this CRM serves one Aircall workspace, the user's. For a
 * marketplace-style multi-tenant integration we'd switch to OAuth Bearer.
 *
 * Docs: https://developer.aircall.io/api-references/
 */

const BASE = "https://api.aircall.io/v1";

function basicAuth(): string {
  const id = process.env.AIRCALL_API_ID;
  const token = process.env.AIRCALL_API_TOKEN;
  if (!id || !token) {
    throw new Error(
      "AIRCALL_API_ID / AIRCALL_API_TOKEN are not set. Configure them in .env.local or Vercel project settings.",
    );
  }
  return "Basic " + Buffer.from(`${id}:${token}`).toString("base64");
}

export type AircallUser = {
  id: number;
  name: string;
  email: string;
  extension: string | null;
  available: boolean;
  availability_status: string;
};

export type AircallNumber = {
  id: number;
  digits: string;
  name: string;
  country: string;
  live_recording_activated: boolean;
};

export type AircallContact = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  description: string | null;
  emails: { value: string; label?: string }[];
  phone_numbers: { value: string; label?: string }[];
};

export type AircallCall = {
  id: number;
  direct_link: string;
  direction: "inbound" | "outbound";
  status: "initial" | "answered" | "done";
  missed_call_reason: string | null;
  started_at: number;
  answered_at: number | null;
  ended_at: number | null;
  duration: number | null;
  voicemail: string | null;
  recording: string | null;
  asset: string | null;
  raw_digits: string;
  archived: boolean;
  user: AircallUser | null;
  contact: AircallContact | null;
  number: AircallNumber | null;
  tags: { id: number; name: string; color: string }[];
  comments: { id: number; content: string }[];
};

class AircallError extends Error {
  status: number;
  body: string;
  constructor(message: string, status: number, body: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: basicAuth(),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    // Aircall caches nothing; we never want Next to either.
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AircallError(
      `Aircall ${method} ${path} → ${res.status}`,
      res.status,
      text,
    );
  }

  // POST /dial returns 204 No Content; other endpoints return JSON.
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ── Users & numbers ─────────────────────────────────────────────────────────

export async function listAircallUsers(): Promise<AircallUser[]> {
  const r = await request<{ users: AircallUser[] }>("GET", "/users?per_page=50");
  return r.users;
}

export async function listAircallNumbers(): Promise<AircallNumber[]> {
  const r = await request<{ numbers: AircallNumber[] }>(
    "GET",
    "/numbers?per_page=50",
  );
  return r.numbers;
}

// ── Click-to-Dial ───────────────────────────────────────────────────────────

/**
 * Server-side click-to-dial: pre-fills the dialpad of the user's Phone app
 * with the given E.164 number. Requires the user to be online in Aircall.
 * Prefer the in-browser SDK trigger when the dialer is embedded — this is a
 * fallback for headless flows (cron, AI tool calls, etc.).
 */
export async function dialNumber(
  aircallUserId: number,
  e164: string,
): Promise<void> {
  await request<void>("POST", `/users/${aircallUserId}/dial`, { to: e164 });
}

// ── Contacts ────────────────────────────────────────────────────────────────

export async function searchAircallContacts(
  phoneNumber: string,
): Promise<AircallContact[]> {
  const q = encodeURIComponent(phoneNumber);
  const r = await request<{ contacts: AircallContact[] }>(
    "GET",
    `/contacts/search?phone_number=${q}`,
  );
  return r.contacts ?? [];
}

export async function createAircallContact(input: {
  firstName: string;
  lastName: string;
  companyName?: string | null;
  email?: string | null;
  phoneNumber: string;
}): Promise<AircallContact> {
  const r = await request<{ contact: AircallContact }>("POST", "/contacts", {
    first_name: input.firstName,
    last_name: input.lastName,
    company_name: input.companyName ?? null,
    information: null,
    emails: input.email ? [{ label: "Work", value: input.email }] : [],
    phone_numbers: [{ label: "Mobile", value: input.phoneNumber }],
  });
  return r.contact;
}

// ── Calls ───────────────────────────────────────────────────────────────────

export async function getAircallCall(callId: number): Promise<AircallCall> {
  const r = await request<{ call: AircallCall }>("GET", `/calls/${callId}`);
  return r.call;
}

/**
 * Download a recording from Aircall's CDN. The signed URL on the call object
 * is valid for ~10 minutes after the call ends, so we mirror the bytes to our
 * own Blob storage as soon as the webhook fires.
 */
export async function downloadRecording(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new AircallError(
      `Recording download → ${res.status}`,
      res.status,
      await res.text().catch(() => ""),
    );
  }
  return await res.arrayBuffer();
}

export { AircallError };
