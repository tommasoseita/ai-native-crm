"use server";

import { redirect } from "next/navigation";
import {
  createSession,
  destroyAllSessionsForUser,
  destroySession,
  getCurrentUser,
  getUserByEmail,
  getUserById,
} from "./auth";
import { hashPassword, verifyPassword } from "./password";
import { getDb } from "./db";

export type AuthFormState = { error?: string; email?: string };

/** Small uniform delay so failed logins don't leak which check rejected. */
function failDelay() {
  return new Promise((r) => setTimeout(r, 250 + Math.random() * 250));
}

export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) {
    return { error: "Email and password are required.", email };
  }

  const user = await getUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await failDelay();
    // React 19 resets uncontrolled forms after an action: hand the email back
    // so the user only has to retype the password.
    return { error: "Invalid email or password.", email };
  }

  await createSession(user.id);
  redirect(user.mustChangePassword ? "/change-password" : "/");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export async function changePassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login");

  const current = String(formData.get("currentPassword") || "");
  const next = String(formData.get("newPassword") || "");
  const confirm = String(formData.get("confirmPassword") || "");

  if (next.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (next !== confirm) {
    return { error: "Passwords do not match." };
  }

  const user = await getUserById(sessionUser.id);
  if (!user || !(await verifyPassword(current, user.passwordHash))) {
    await failDelay();
    return { error: "Current password is incorrect." };
  }
  if (next === current) {
    return { error: "New password must be different from the current one." };
  }

  const db = await getDb();
  await db.execute({
    sql: "UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?",
    args: [await hashPassword(next), user.id],
  });

  // Rotate every session after a credential change.
  await destroyAllSessionsForUser(user.id);
  await createSession(user.id);
  redirect("/");
}
