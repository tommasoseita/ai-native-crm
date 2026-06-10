"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { KeyRound, Trash2, UserPlus } from "lucide-react";
import {
  createUser,
  deleteUser,
  resetUserPassword,
  updateUserRole,
  type UserFormState,
} from "@/lib/user-actions";
import type { AppUser, UserRole } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { Field, RecordDialog, useDialogState } from "./RecordDialog";
import { useToast } from "./Toast";

const initialState: UserFormState = {};

export function AddUserButton() {
  const { open, openDialog, closeDialog } = useDialogState();
  return (
    <>
      <button onClick={openDialog} className="btn-primary">
        <UserPlus size={12} />
        <span>Add user</span>
      </button>
      <RecordDialog
        open={open}
        onClose={closeDialog}
        title="Add user"
        description="They'll set their own password the first time they sign in."
      >
        <CreateUserForm onDone={closeDialog} />
      </RecordDialog>
    </>
  );
}

function CreateUserForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(createUser, initialState);
  const toast = useToast();

  useEffect(() => {
    if (state.ok) {
      toast.success("User created. They'll set their own password at first sign-in.");
      onDone();
    }
  }, [state.ok, onDone, toast]);

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3.5">
      <div className="col-span-2">
        <Field label="Name" name="name" required>
          <input
            name="name"
            required
            autoFocus
            placeholder="e.g. Jane Cooper"
            className="input"
          />
        </Field>
      </div>
      <div className="col-span-2">
        <Field label="Email" name="email" required>
          <input
            name="email"
            type="email"
            required
            placeholder="jane@company.com"
            className="input"
          />
        </Field>
      </div>
      <Field label="Temporary password" name="password" required hint="Min. 8 characters">
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="input"
        />
      </Field>
      <Field label="Role" name="role">
        <select name="role" defaultValue="user" className="input">
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </Field>
      {state.error && (
        <p
          role="alert"
          className="col-span-2 bg-[var(--danger-soft)] border border-red-200/60 text-[var(--danger)] rounded-md px-3 py-2 text-[12.5px]"
        >
          {state.error}
        </p>
      )}
      <div className="col-span-2 flex justify-end gap-2 pt-1">
        <button type="button" onClick={onDone} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Adding…" : "Add user"}
        </button>
      </div>
    </form>
  );
}

function ResetPasswordForm({ user, onDone }: { user: AppUser; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(resetUserPassword, initialState);
  const toast = useToast();

  useEffect(() => {
    if (state.ok) {
      toast.success(`Password reset for ${user.name}. They've been signed out.`);
      onDone();
    }
  }, [state.ok, onDone, toast, user.name]);

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <input type="hidden" name="userId" value={user.id} />
      <Field
        label="New temporary password"
        name="password"
        required
        hint={`${user.name} will be signed out everywhere and asked to choose a new password.`}
      >
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoFocus
          placeholder="Min. 8 characters"
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
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onDone} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Resetting…" : "Reset password"}
        </button>
      </div>
    </form>
  );
}

export function UsersManager({
  users,
  currentUserId,
}: {
  users: AppUser[];
  currentUserId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [roleError, setRoleError] = useState<{ userId: string; message: string } | null>(
    null,
  );
  const [resetUser, setResetUser] = useState<AppUser | null>(null);
  const toast = useToast();

  const onRoleChange = (user: AppUser, role: UserRole) => {
    setRoleError(null);
    startTransition(async () => {
      const res = await updateUserRole(user.id, role);
      if (res.error) {
        setRoleError({ userId: user.id, message: res.error });
        toast.error(res.error);
      } else {
        toast.success(`${user.name} is now ${role === "admin" ? "an admin" : "a user"}.`);
      }
    });
  };

  const onDelete = (user: AppUser) => {
    if (!confirm(`Delete ${user.name}? They will lose access immediately. This cannot be undone.`)) {
      return;
    }
    startTransition(async () => {
      const res = await deleteUser(user.id);
      if (res.error) toast.error(res.error);
      else toast.success(`${user.name} was removed.`);
    });
  };

  return (
    <div className="page-enter flex-1 overflow-auto scrollbar-thin bg-[var(--surface)]">
      <table className="w-full text-[13px]">
        <thead className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface)]">
          <tr className="text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            <th className="px-4 py-2.5">User</th>
            <th className="px-3 py-2.5">Email</th>
            <th className="px-3 py-2.5">Role</th>
            <th className="px-3 py-2.5">Password</th>
            <th className="px-3 py-2.5">Created</th>
            <th className="px-3 py-2.5">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isSelf = u.id === currentUserId;
            return (
              <tr
                key={u.id}
                className="border-b border-[var(--border)] transition-colors duration-150 hover:bg-[var(--sidebar)]"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={u.name} size="sm" />
                    <span className="font-medium">{u.name}</span>
                    {isSelf && <span className="pill pill-soft">You</span>}
                  </div>
                </td>
                <td className="px-3 py-3 text-[var(--muted-foreground)]">{u.email}</td>
                <td className="px-3 py-3">
                  <select
                    key={`${u.id}:${u.role}`}
                    defaultValue={u.role}
                    disabled={isSelf || pending}
                    title={isSelf ? "You cannot change your own role" : undefined}
                    onChange={(e) => onRoleChange(u, e.target.value as UserRole)}
                    className="input"
                    style={{ width: "auto", padding: "5px 8px", fontSize: "12.5px" }}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  {roleError?.userId === u.id && (
                    <div role="alert" className="mt-1 text-[11.5px] text-[var(--danger)]">
                      {roleError.message}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3">
                  {u.mustChangePassword ? (
                    <span
                      className="pill"
                      style={{
                        background: "var(--warning-soft)",
                        color: "#92400e",
                      }}
                    >
                      Must change password
                    </span>
                  ) : (
                    <span className="text-[var(--muted)]">—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-[var(--muted-foreground)]">
                  {formatDate(u.createdAt)}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setResetUser(u)}
                      title="Reset password"
                      aria-label="Reset password"
                      className="btn-icon"
                    >
                      <KeyRound size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(u)}
                      disabled={isSelf || pending}
                      title={isSelf ? "You cannot delete your own account" : "Delete user"}
                      aria-label="Delete user"
                      className="btn-icon"
                      style={{
                        color: isSelf ? "var(--muted)" : "var(--muted)",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelf && !pending) {
                          e.currentTarget.style.background = "var(--danger-soft)";
                          e.currentTarget.style.color = "var(--danger)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "";
                        e.currentTarget.style.color = "var(--muted)";
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <RecordDialog
        open={resetUser !== null}
        onClose={() => setResetUser(null)}
        title={resetUser ? `Reset password for ${resetUser.name}` : "Reset password"}
        description="They'll be signed out everywhere and prompted to choose a new password."
      >
        {resetUser && (
          <ResetPasswordForm
            key={resetUser.id}
            user={resetUser}
            onDone={() => setResetUser(null)}
          />
        )}
      </RecordDialog>
    </div>
  );
}
