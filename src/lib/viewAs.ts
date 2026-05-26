import "server-only";
import { cookies } from "next/headers";
import { TEAM, type TeamMember } from "./types";

const VIEW_AS_COOKIE = "crm_as";

/**
 * The SDR the UI is currently being viewed as. Resolves in this order:
 *   - `?as=u1` query string (overrides cookie, useful for sharing/testing)
 *   - `crm_as` cookie
 *   - fallback to "u1"
 *
 * Query-string handling is performed by the page via `searchParams`; this
 * helper only reads the cookie since `cookies()` is not aware of search
 * params. Pages that want to honor `?as=` should call `resolveSdr(query)`.
 */
export async function currentSdr(): Promise<TeamMember> {
  const store = await cookies();
  const id = store.get(VIEW_AS_COOKIE)?.value || "u1";
  return TEAM.find((m) => m.id === id) ?? TEAM[0];
}

export async function currentSdrId(): Promise<string> {
  return (await currentSdr()).id;
}

export function resolveSdr(searchParams?: { as?: string }): TeamMember {
  const id = searchParams?.as;
  if (id) {
    const m = TEAM.find((t) => t.id === id);
    if (m) return m;
  }
  return TEAM[0];
}
