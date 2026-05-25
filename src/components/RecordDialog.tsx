"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { X } from "lucide-react";

export function RecordDialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-[2px] p-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 className="text-[14px] font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-[var(--sidebar-hover)]"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  name,
  children,
  required,
}: {
  label: string;
  name?: string;
  children: ReactNode;
  required?: boolean;
}) {
  const id = useId();
  return (
    <label className="block" htmlFor={name ?? id}>
      <span className="block text-[11.5px] font-medium text-[var(--muted-foreground)] mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-[var(--border)] bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";

export function useDialogState() {
  const [open, setOpen] = useState(false);
  return { open, openDialog: () => setOpen(true), closeDialog: () => setOpen(false) };
}
