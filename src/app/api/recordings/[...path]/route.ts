import { NextResponse } from "next/server";
import { get, head } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves a call recording from the private Blob store. The Blob URL
 * returned by `head()` on a private/OIDC store is NOT a publicly-
 * accessible signed URL — accessing it from a browser without the
 * server's OIDC token returns 401. So instead of 302-ing to it, we
 * stream the bytes through this endpoint, with auth applied here.
 *
 * Authorization: any signed-in user can play a recording of a call
 * they were the SDR on; admins can play any. Non-admins playing a
 * call with no `sdr_id` attribution are denied — they can ask the
 * admin to map them and the next sync will backfill.
 */
export async function GET(
  req: Request,
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

  // Admin diagnostic: `?diag=1` returns Blob metadata as JSON. Kept for
  // future debugging; no-op for non-admins.
  const url = new URL(req.url);
  if (url.searchParams.get("diag") === "1" && user.role === "admin") {
    try {
      const meta = await head(pathname);
      return NextResponse.json({
        pathname: meta.pathname,
        size: meta.size,
        contentType: meta.contentType,
        contentDisposition: meta.contentDisposition,
        uploadedAt: meta.uploadedAt,
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : "head failed";
      return NextResponse.json({ error: reason }, { status: 500 });
    }
  }

  try {
    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return new Response(result.stream, {
      status: 200,
      headers: {
        "Content-Type": result.blob.contentType || "audio/mpeg",
        "Content-Length": String(result.blob.size),
        "Cache-Control": "private, max-age=300",
        "Content-Disposition": "inline",
      },
    });
  } catch (err) {
    console.error("[recordings] get() failed", pathname, err);
    return NextResponse.json({ error: "blob fetch failed" }, { status: 500 });
  }
}
