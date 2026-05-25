import { STAGES, type DealStage } from "@/lib/types";

export function StagePill({ stage }: { stage: DealStage }) {
  const meta = STAGES.find((s) => s.id === stage);
  if (!meta) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--sidebar-hover)] px-2 py-0.5 text-[11px]">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}
