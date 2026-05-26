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
    <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-white px-3 py-2.5">
      <div className="flex flex-col gap-0.5">
        <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
          Capacity
        </div>
        <div className="text-[18px] font-semibold tabular-nums">
          {used + pending}
          <span className="text-[var(--muted)] font-normal">/{cap}</span>
        </div>
      </div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--sidebar-hover)]">
        <div className="flex h-full">
          <div className="h-full bg-emerald-500" style={{ width: `${usedPct}%` }} />
          <div className="h-full bg-amber-400" style={{ width: `${pendingPct}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-3 text-[11.5px] text-[var(--muted-foreground)]">
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
