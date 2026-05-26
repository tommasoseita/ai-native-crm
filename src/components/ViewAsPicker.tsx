"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Avatar } from "./Avatar";
import { setViewAs } from "@/lib/actions";
import { TEAM, type TeamMember } from "@/lib/types";

export function ViewAsPicker({ current }: { current: TeamMember }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[12px] hover:bg-[var(--sidebar-hover)]"
      >
        <span className="text-[var(--muted)]">Viewing as</span>
        <Avatar name={current.name} color={current.color} size="xs" />
        <span className="font-medium">{current.name}</span>
        <ChevronDown size={11} className="text-[var(--muted)]" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-lg">
          {TEAM.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setOpen(false);
                startTransition(() => {
                  setViewAs(m.id);
                });
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[var(--sidebar-hover)]"
            >
              <Avatar name={m.name} color={m.color} size="xs" />
              <span className="flex-1">{m.name}</span>
              <span className="text-[11px] text-[var(--muted)]">
                {m.dailyCap}/day
              </span>
              {m.id === current.id && <Check size={12} className="text-[var(--accent)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
