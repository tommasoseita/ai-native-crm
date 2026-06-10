"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Modal dialog with a real enter/exit animation. We keep the node mounted
 * while it animates out (closing=true) so the backdrop fade and panel
 * scale-down both play instead of the modal popping off the screen.
 */
export function RecordDialog({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const [render, setRender] = useState(open);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
      setClosing(false);
      setRender(true);
    } else if (render) {
      setClosing(true);
      closeTimer.current = setTimeout(() => {
        setRender(false);
        setClosing(false);
      }, 200);
    }
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [open, render]);

  useEffect(() => {
    if (!render) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [render, onClose]);

  if (!render) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh] pb-8"
      style={{
        background: "rgba(15, 17, 21, 0.32)",
        backdropFilter: "blur(6px) saturate(140%)",
        WebkitBackdropFilter: "blur(6px) saturate(140%)",
        animation: closing
          ? "fade-in var(--dur) var(--ease) reverse forwards"
          : "fade-in var(--dur) var(--ease) both",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white border border-[var(--border)]"
        style={{
          boxShadow: "var(--shadow-xl)",
          animation: closing
            ? "scale-in var(--dur) var(--ease) reverse forwards"
            : "scale-in var(--dur-slow) var(--ease-out) both",
          transformOrigin: "50% 30%",
        }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-3.5">
          <div className="min-w-0">
            <h2
              id="dialog-title"
              className="text-[14.5px] font-semibold tracking-tight leading-tight"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-[12px] text-[var(--muted-foreground)] leading-snug">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-icon -mr-1 -mt-1"
            aria-label="Close dialog"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  name,
  hint,
  children,
  required,
}: {
  label: string;
  name?: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
}) {
  const id = useId();
  return (
    <label className="block group" htmlFor={name ?? id}>
      <span className="flex items-center gap-1 mb-1.5 text-[11.5px] font-medium tracking-wide text-[var(--muted-foreground)]">
        {label}
        {required && <span className="text-[var(--danger)]">*</span>}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[11px] text-[var(--muted)]">{hint}</span>
      )}
    </label>
  );
}

// Kept for backwards-compat with all existing form callers.
export const inputClass = "input";

export function useDialogState() {
  const [open, setOpen] = useState(false);
  return { open, openDialog: () => setOpen(true), closeDialog: () => setOpen(false) };
}
