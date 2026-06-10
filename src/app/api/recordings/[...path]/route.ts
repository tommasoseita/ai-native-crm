import { NextResponse } from "next/server";
import { head } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves a call recording from the private Blob store. The audio player
 * in the UI hits this URL, we re-check the user's authorisation against
 * the `calls.recording_url` pathname, then 302-redirect to a freshly-
 * minted signed URL from `head(pathname)`.
 *
 * Authorization rule: any signed-in user can play a recording of a call
 * they were the SDR on; admins can play any. Non-admins playing a call
 * with no `sdr_id` attribution (because the mapping was missing at sync
 * time) are denied — they can still ask an admin to map them and the
 * next sync will backfill.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { path } = await ctx.params;
  const pathname = path.join("/");

  const db = await getDb();
  const r = await db.execute({
    sql: "SELECT sdr_id FROM calls WHERE recording_url = ? LIMIT 1",
    args: [pathname],
  });
  const row = r.rows[0] as unknown as { sdr_id: string | null } | undefined;
  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (user.role !== "admin" && row.sdr_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const blob = await head(pathname);
    // `url` is the inline-streamable signed URL; the player just follows
    // the 302 and gets bytes directly from Vercel Blob's edge.
    return NextResponse.redirect(blob.url, 302);
  } catch (err) {
    console.error("[recordings] head() failed", pathname, err);
    return NextResponse.json({ error: "blob lookup failed" }, { status: 500 });
  }
}
