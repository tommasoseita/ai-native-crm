"use client";

import { useTransition } from "react";
import { Plus, Zap } from "lucide-react";
import { enrollPerson } from "@/lib/actions";

export function EnrollButton({
  personId,
  sequenceId,
  sdrId,
  label = "Enroll",
  variant = "secondary",
}: {
  personId: string;
  sequenceId: string;
  sdrId: string;
  label?: string;
  variant?: "primary" | "secondary";
}) {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    const fd = new FormData();
    fd.set("personId", personId);
    fd.set("sequenceId", sequenceId);
    fd.set("sdrId", sdrId);
    startTransition(() => {
      enrollPerson(fd);
    });
  };

  const base =
    "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-medium disabled:opacity-50";
  const className =
    variant === "primary"
      ? `${base} bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90`
      : `${base} border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--sidebar-hover)]`;

  return (
    <button onClick={onClick} disabled={pending} className={className}>
      {variant === "primary" ? <Zap size={11} /> : <Plus size={11} />}
      <span>{label}</span>
    </button>
  );
}
