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
import { Field, RecordDialog, inputClass, useDialogState } from "./RecordDialog";

const initialState: UserFormState = {};

export function AddUserButton() {
  const { open, openDialog, closeDialog } = useDialogState();
  return (
    <>
      <button
        onClick={openDialog}
        className="flex items-center gap-1 rounded-md bg-[var(--foreground)] px-2.5 py-1.5 text-[12px] font-medium text-white hover:bg-black"
      >
        <UserPlus size={12} />
        <span>Add user</span>
      </button>
      <RecordDialog open={open} onClose={closeDialog} title="Add user">
        <CreateUserForm onDone={closeDialog} />
      </RecordDialog>
    </>
  );
}

function CreateUserForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, pending] = useActionState(createUser, initialState);

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <Field label="Name" name="name" required>
          <input
            name="name"
            required
            autoFocus
            placeholder="e.g. Jane Cooper"
            className={inputClass}
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
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Temporary password" name="password" required>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Min. 8 characters"
          className={inputClass}
        />
      </Field>
      <Field label="Role" name="role">
        <select name="role" defaultValue="user" className={inputClass}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </Field>
      <p className="col-span-2 text-[11.5px] text-[var(--muted-foreground)]">
        The user will be asked to change this password the first time they sign in.
      </p>
      {state.error && (
        <p role="alert" className="col-span-2 text-[12.5px] text-red-600">
          {state.error}
        </p>
      )}
      <div className="col-span-2 flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-[var(--border)] px-3 py-1.5 text-[12px] hover:bg-[var(--sidebar-hover)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[var(--foreground)] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-black disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add user"}
        </button>
      </div>
    </form>
  );
}

function ResetPasswordForm({ user, onDone }: { user: AppUser; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(resetUserPassword, initialState);

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="userId" value={user.id} />
      <Field label="New temporary password" name="password" required>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoFocus
          placeholder="Min. 8 characters"
          className={inputClass}
        />
      </Field>
      <p className="text-[11.5px] text-[var(--muted-foreground)]">
        {user.name} will be signed out everywhere and asked to choose a new password the
        next time they sign in.
      </p>
      {state.error && (
        <p role="alert" className="text-[12.5px] text-red-600">
          {state.error}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-[var(--border)] px-3 py-1.5 text-[12px] hover:bg-[var(--sidebar-hover)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[var(--foreground)] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-black disabled:opacity-50"
        >
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

  const onRoleChange = (userId: string, role: UserRole) => {
    setRoleError(null);
    startTransition(async () => {
      const res = await updateUserRole(userId, role);
      if (res.error) setRoleError({ userId, message: res.error });
    });
  };

  const onDelete = (user: AppUser) => {
    if (!confirm(`Delete ${user.name}? They will lose access immediately. This cannot be undone.`)) {
      return;
    }
    startTransition(async () => {
      const res = await deleteUser(user.id);
      if (res.error) alert(res.error);
    });
  };

  return (
    <div className="flex-1 overflow-auto scrollbar-thin bg-white">
      <table className="w-full text-[13px]">
        <thead className="sticky top-0 z-10 border-b border-[var(--border)] bg-white">
          <tr className="text-left text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
            <th className="px-3 py-2 font-medium">User</th>
            <th className="px-3 py-2 font-medium">Email</th>
            <th className="px-3 py-2 font-medium">Role</th>
            <th className="px-3 py-2 font-medium">Password</th>
            <th className="px-3 py-2 font-medium">Created</th>
            <th className="px-3 py-2 font-medium">
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
                className="border-b border-[var(--border)] hover:bg-[var(--sidebar-hover)]"
              >
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Avatar name={u.name} size="xs" />
                    <span className="font-medium">{u.name}</span>
                    {isSelf && (
                      <span className="rounded-full bg-[var(--sidebar-hover)] px-1.5 py-0.5 text-[11px] text-[var(--muted-foreground)]">
                        You
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-[var(--muted-foreground)]">{u.email}</td>
                <td className="px-3 py-2.5">
                  <select
                    key={`${u.id}:${u.role}`}
                    defaultValue={u.role}
                    disabled={isSelf || pending}
                    title={isSelf ? "You cannot change your own role" : undefined}
                    onChange={(e) => onRoleChange(u.id, e.target.value as UserRole)}
                    className="rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[12.5px] outline-none focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  {roleError?.userId === u.id && (
                    <div role="alert" className="mt-1 text-[11.5px] text-red-600">
                      {roleError.message}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {u.mustChangePassword ? (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
                      Must change password
                    </span>
                  ) : (
                    <span className="text-[var(--muted)]">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-[var(--muted-foreground)]">
                  {formatDate(u.createdAt)}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setResetUser(u)}
                      title="Reset password"
                      aria-label="Reset password"
                      className="rounded p-1 text-[var(--muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)]"
                    >
                      <KeyRound size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(u)}
                      disabled={isSelf || pending}
                      title={isSelf ? "You cannot delete your own account" : "Delete user"}
                      aria-label="Delete user"
                      className="rounded p-1 text-[var(--muted)] enabled:hover:bg-red-50 enabled:hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
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
