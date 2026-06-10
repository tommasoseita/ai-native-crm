"use client";

import { useActionState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { changePassword, type AuthFormState } from "@/lib/auth-actions";
import { Field } from "@/components/RecordDialog";

const initialState: AuthFormState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field label="Current password" name="currentPassword" required>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className="input"
        />
      </Field>
      <Field label="New password (min 8 characters)" name="newPassword" required>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="input"
        />
      </Field>
      <Field label="Confirm new password" name="confirmPassword" required>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="input"
        />
      </Field>
      {state.error && (
        <p
          role="alert"
          className="bg-[var(--danger-soft)] border border-red-200/60 text-[var(--danger)] rounded-md px-3 py-2 text-[12.5px]"
        >
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn-accent mt-1 w-full"
        style={{ height: "40px" }}
      >
        {pending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <Lock size={14} />
            Save new password
          </>
        )}
      </button>
    </form>
  );
}
