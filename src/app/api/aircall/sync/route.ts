import { NextResponse } from "next/server";
import { syncRecentCalls } from "@/lib/aircall-sync";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Pull-and-upload-recordings can take >10s on a busy workspace. Vercel's
// hobby tier caps at 60s; pro lifts to 300. We aim for 60.
export const maxDuration = 60;

/**
 * Aircall polling endpoint. Called by Vercel Cron on the schedule in
 * vercel.json (every 3 minutes on Pro; Hobby caps granularity at daily
 * which would lag the CRM too much). Also callable by an admin from
 * the browser for an immediate refresh between ticks.
 *
 * Auth: either the Vercel-Cron header (set automatically when the
 * scheduler triggers the route) or an admin session.
 */
export async function GET(req: Request) {
  const cronHeader = req.headers.get("x-vercel-cron");
  let authorized = !!cronHeader;

  // Manual trigger from the admin UI / API.
  if (!authorized) {
    const user = await getCurrentUser();
    if (user?.role === "admin") authorized = true;
  }

  if (!authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncRecentCalls();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[aircall sync] failed", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
