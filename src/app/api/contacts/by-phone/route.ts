import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lookup a CRM contact by dialled number. Used by the embedded dialer
 * for screen-pop on inbound calls and for context display on click-to-dial.
 * Match is the same trailing-9-digits heuristic the sync job uses.
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const raw = url.searchParams.get("phone") ?? "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return NextResponse.json({ person: null });

  const key = digits.length > 9 ? digits.slice(-9) : digits;

  const db = await getDb();
  const r = await db.execute({
    sql: `SELECT p.id, p.first_name, p.last_name, p.email, p.role,
                 p.company_id, c.name AS company_name
          FROM people p
          LEFT JOIN companies c ON c.id = p.company_id
          WHERE p.phone IS NOT NULL
            AND substr(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(p.phone, ' ', ''), '-', ''), '(', ''), ')', ''), '+', ''),
                       -9) = ?
          ORDER BY (p.last_contacted_at IS NULL) ASC, p.last_contacted_at DESC
          LIMIT 1`,
    args: [key],
  });
  const row = r.rows[0] as unknown as
    | {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        role: string | null;
        company_id: string | null;
        company_name: string | null;
      }
    | undefined;

  if (!row) return NextResponse.json({ person: null });

  return NextResponse.json({
    person: {
      id: row.id,
      name: `${row.first_name} ${row.last_name}`.trim(),
      email: row.email,
      role: row.role,
      companyId: row.company_id,
      companyName: row.company_name,
    },
  });
}
