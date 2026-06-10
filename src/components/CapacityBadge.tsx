export function CapacityBadge({
  cap,
  used,
  pending,
  free,
}: {
  cap: number;
  used: number;
  pending: number;
  free: number;
}) {
  const usedPct = Math.min(100, (used / cap) * 100);
  const pendingPct = Math.min(100 - usedPct, (pending / cap) * 100);

  return (
    <div
      className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
      style={{ boxShadow: "var(--shadow-xs)" }}
    >
      <div className="flex flex-col gap-0.5 min-w-[78px]">
        <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
          Capacity
        </div>
        <div className="text-[20px] font-semibold tabular-nums leading-none mt-1">
          {used + pending}
          <span className="text-[var(--muted)] font-normal">/{cap}</span>
        </div>
      </div>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[var(--sidebar-hover)]">
        <div className="flex h-full">
          <div
            className="h-full transition-[width] duration-500 ease-out"
            style={{
              width: `${usedPct}%`,
              background:
                "linear-gradient(90deg, var(--success) 0%, #34d399 100%)",
            }}
          />
          <div
            className="h-full transition-[width] duration-500 ease-out"
            style={{
              width: `${pendingPct}%`,
              background:
                "linear-gradient(90deg, var(--warning) 0%, #fbbf24 100%)",
            }}
          />
        </div>
      </div>
      <div className="flex items-center gap-3.5 text-[11.5px] text-[var(--muted-foreground)]">
        <Stat color="bg-emerald-500" label="Done" value={used} />
        <Stat color="bg-amber-400" label="Pending" value={pending} />
        <Stat color="bg-slate-200" label="Free" value={free} />
      </div>
    </div>
  );
}

function Stat({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="tabular-nums font-medium text-[var(--foreground)]">{value}</span>
      <span>{label}</span>
    </div>
  );
}
