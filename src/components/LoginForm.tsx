"use client";

import { useActionState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { login, type AuthFormState } from "@/lib/auth-actions";
import { Field } from "@/components/RecordDialog";

const initialState: AuthFormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Field label="Email" name="email" required>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          defaultValue={state.email ?? ""}
          className="input"
          placeholder="you@company.com"
        />
      </Field>
      <Field label="Password" name="password" required>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          placeholder="••••••••"
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
            Signing in…
          </>
        ) : (
          <>
            Sign in
            <ArrowRight size={14} />
          </>
        )}
      </button>
    </form>
  );
}
