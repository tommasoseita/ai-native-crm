"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type Toast = {
  id: number;
  kind: "success" | "error" | "info";
  message: string;
};

type ToastContext = {
  show: (kind: Toast["kind"], message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

const Ctx = createContext<ToastContext | null>(null);

export function useToast(): ToastContext {
  const v = useContext(Ctx);
  if (!v) {
    // Render outside provider: silent no-op so legacy callers don't crash.
    return { show: () => {}, success: () => {}, error: () => {} };
  }
  return v;
}

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((kind: Toast["kind"], message: string) => {
    const id = nextId++;
    setToasts((t) => [...t, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  const value: ToastContext = {
    show,
    success: (m) => show("success", m),
    error: (m) => show("error", m),
  };

  return (
    <Ctx.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={(id) =>
        setToasts((t) => t.filter((x) => x.id !== id))
      } />
    </Ctx.Provider>
  );
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col-reverse gap-2 max-w-[360px]">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setLeaving(true), 3800);
    return () => window.clearTimeout(t);
  }, []);

  const Icon = toast.kind === "error" ? AlertCircle : CheckCircle2;
  const accent =
    toast.kind === "error"
      ? "var(--danger)"
      : toast.kind === "info"
        ? "var(--accent)"
        : "var(--success)";

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto flex items-start gap-2.5 rounded-xl bg-[var(--surface)] px-3.5 py-3 text-[13px]"
      style={{
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-lg)",
        animation: leaving
          ? "toast-in var(--dur-slow) var(--ease-spring) reverse forwards"
          : "toast-in var(--dur-slow) var(--ease-spring) both",
        minWidth: 280,
      }}
    >
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
        style={{
          background: accent,
          color: "#fff",
          boxShadow: `0 0 0 4px ${accent}22`,
        }}
      >
        <Icon size={12} strokeWidth={2.5} />
      </span>
      <span className="flex-1 leading-snug text-[var(--foreground-soft)]">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="btn-icon -mr-1 -mt-1"
        style={{ width: 22, height: 22 }}
      >
        <X size={12} />
      </button>
    </div>
  );
}
