"use client";

import { useTransition } from "react";
import { STAGES, type DealStage } from "@/lib/types";
import { moveDeal } from "@/lib/actions";

export function DealStageSelector({
  dealId,
  current,
}: {
  dealId: string;
  current: DealStage;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-1">
      {STAGES.map((s) => {
        const active = s.id === current;
        return (
          <button
            key={s.id}
            disabled={pending}
            onClick={() => {
              if (active) return;
              startTransition(() => {
                moveDeal(dealId, s.id, [dealId]);
              });
            }}
            className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] transition-colors ${
              active
                ? "border-transparent text-white"
                : "border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:border-[var(--accent)]/40"
            }`}
            style={active ? { background: s.color } : {}}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: active ? "white" : s.color }}
            />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
