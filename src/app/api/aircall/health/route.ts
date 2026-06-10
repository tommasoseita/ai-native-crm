import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listAircallNumbers, listAircallUsers, AircallError } from "@/lib/aircall";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin-only diagnostic endpoint. Confirms the Aircall credentials are
 * valid and returns the workspace inventory we'll need for the admin UI
 * (user mapping, number picker).
 */
export async function GET() {
  await requireAdmin();
  try {
    const [users, numbers] = await Promise.all([
      listAircallUsers(),
      listAircallNumbers(),
    ]);
    return NextResponse.json({
      ok: true,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        extension: u.extension,
        available: u.available,
      })),
      numbers: numbers.map((n) => ({
        id: n.id,
        digits: n.digits,
        name: n.name,
        country: n.country,
        liveRecording: n.live_recording_activated,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    const status = err instanceof AircallError ? err.status : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
