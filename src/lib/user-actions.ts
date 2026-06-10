"use server";

import { revalidatePath } from "next/cache";
import {
  destroyAllSessionsForUser,
  getUserByEmail,
  newUserId,
  requireAdmin,
} from "./auth";
import { hashPassword } from "./password";
import { getDb } from "./db";
import type { UserRole } from "./types";

export type UserFormState = { error?: string; ok?: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseRole(value: unknown): UserRole {
  return value === "admin" ? "admin" : "user";
}

export async function createUser(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = parseRole(formData.get("role"));

  if (!name) return { error: "Name is required." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 8) {
    return { error: "Temporary password must be at least 8 characters." };
  }
  if (await getUserByEmail(email)) {
    return { error: "A user with this email already exists." };
  }

  const db = await getDb();
  await db.execute({
    sql: `INSERT INTO users (id, email, name, role, password_hash, must_change_password, created_at)
          VALUES (?, ?, ?, ?, ?, 1, ?)`,
    args: [
      newUserId(),
      email,
      name,
      role,
      await hashPassword(password),
      new Date().toISOString(),
    ],
  });

  revalidatePath("/settings/users");
  return { ok: true };
}

export async function updateUserRole(userId: string, role: UserRole): Promise<UserFormState> {
  const admin = await requireAdmin();
  if (userId === admin.id) {
    return { error: "You cannot change your own role." };
  }

  const db = await getDb();
  await db.execute({
    sql: "UPDATE users SET role = ? WHERE id = ?",
    args: [parseRole(role), userId],
  });
  // Role is read from the users row on every request, so existing sessions
  // pick up the change immediately — no session invalidation needed.
  revalidatePath("/settings/users");
  return { ok: true };
}

export async function resetUserPassword(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") || "");
  const password = String(formData.get("password") || "");

  if (userId === admin.id) {
    return { error: "Use the change-password page for your own account." };
  }
  if (password.length < 8) {
    return { error: "Temporary password must be at least 8 characters." };
  }

  const db = await getDb();
  const r = await db.execute({
    sql: "UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?",
    args: [await hashPassword(password), userId],
  });
  if (r.rowsAffected === 0) return { error: "User not found." };

  await destroyAllSessionsForUser(userId);
  revalidatePath("/settings/users");
  return { ok: true };
}

export async function deleteUser(userId: string): Promise<UserFormState> {
  const admin = await requireAdmin();
  if (userId === admin.id) {
    return { error: "You cannot delete your own account." };
  }

  const db = await getDb();
  // Explicit two-step delete: FK cascade needs PRAGMA foreign_keys per
  // connection, which the HTTP driver does not guarantee.
  await db.batch(
    [
      { sql: "DELETE FROM sessions WHERE user_id = ?", args: [userId] },
      { sql: "DELETE FROM users WHERE id = ?", args: [userId] },
    ],
    "write",
  );

  revalidatePath("/settings/users");
  return { ok: true };
}
