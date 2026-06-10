import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";
import type { AppUser, UserRole } from "./types";

export const SESSION_COOKIE = "wibo_session";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_RENEW_THRESHOLD_MS = 20 * 24 * 60 * 60 * 1000; // renew when < 20d left

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  must_change_password: number;
  created_at: string;
};

function mapUser(r: UserRow): AppUser {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    mustChangePassword: r.must_change_password === 1,
    createdAt: r.created_at,
  };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(maxAgeMs / 1000),
  };
}

/**
 * Create a DB-backed session for the user and set the session cookie. Only
 * the SHA-256 hash of the token is stored server-side, so a leaked sessions
 * table cannot be replayed against the app.
 */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
    args: [
      hashToken(token),
      userId,
      new Date(now).toISOString(),
      new Date(now + SESSION_TTL_MS).toISOString(),
    ],
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, cookieOptions(SESSION_TTL_MS));
}

/** Delete the current session (if any) and clear the cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.execute({
      sql: "DELETE FROM sessions WHERE id = ?",
      args: [hashToken(token)],
    });
  }
  store.delete(SESSION_COOKIE);
}

/** Invalidate every session of a user (password change, account deletion). */
export async function destroyAllSessionsForUser(userId: string): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "DELETE FROM sessions WHERE user_id = ?",
    args: [userId],
  });
}

/**
 * Resolve the currently authenticated user from the session cookie, or null.
 * Cached per request so layout, page and components share one lookup.
 */
export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = await getDb();
  const sessionId = hashToken(token);
  const r = await db.execute({
    sql: `SELECT u.id, u.email, u.name, u.role, u.must_change_password, u.created_at,
                 s.expires_at
          FROM sessions s INNER JOIN users u ON u.id = s.user_id
          WHERE s.id = ?`,
    args: [sessionId],
  });
  const row = r.rows[0] as unknown as (UserRow & { expires_at: string }) | undefined;
  if (!row) return null;

  const expiresAt = new Date(row.expires_at).getTime();
  if (expiresAt < Date.now()) {
    await db.execute({ sql: "DELETE FROM sessions WHERE id = ?", args: [sessionId] });
    return null;
  }

  // Sliding renewal: bump expiry when the session is past a third of its life.
  // Cookie refresh can fail outside actions/route handlers; renewing the DB row
  // is what matters, so ignore cookie errors during render.
  if (expiresAt - Date.now() < SESSION_RENEW_THRESHOLD_MS) {
    const renewed = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    await db.execute({
      sql: "UPDATE sessions SET expires_at = ? WHERE id = ?",
      args: [renewed, sessionId],
    });
    try {
      store.set(SESSION_COOKIE, token, cookieOptions(SESSION_TTL_MS));
    } catch {
      // Rendering context: cookie writes are not allowed. Safe to skip.
    }
  }

  return mapUser(row);
});

/** Require an authenticated user; redirects to /login otherwise. */
export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Require an authenticated admin; non-admins are sent back to the app home. */
export async function requireAdmin(): Promise<AppUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}

// ── User lookups (used by auth actions and the admin UI) ────────────────────

export async function getUserByEmail(
  email: string,
): Promise<(AppUser & { passwordHash: string }) | null> {
  const db = await getDb();
  const r = await db.execute({
    sql: "SELECT * FROM users WHERE email = ?",
    args: [email.trim().toLowerCase()],
  });
  const row = r.rows[0] as unknown as (UserRow & { password_hash: string }) | undefined;
  return row ? { ...mapUser(row), passwordHash: row.password_hash } : null;
}

export async function getUserById(
  id: string,
): Promise<(AppUser & { passwordHash: string }) | null> {
  const db = await getDb();
  const r = await db.execute({
    sql: "SELECT * FROM users WHERE id = ?",
    args: [id],
  });
  const row = r.rows[0] as unknown as (UserRow & { password_hash: string }) | undefined;
  return row ? { ...mapUser(row), passwordHash: row.password_hash } : null;
}

export async function listUsers(): Promise<AppUser[]> {
  const db = await getDb();
  const r = await db.execute(
    "SELECT id, email, name, role, must_change_password, created_at FROM users ORDER BY created_at ASC",
  );
  return (r.rows as unknown as UserRow[]).map(mapUser);
}

export function newUserId(): string {
  return `usr_${randomUUID().slice(0, 8)}`;
}
