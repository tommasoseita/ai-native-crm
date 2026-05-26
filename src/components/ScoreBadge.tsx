import { TIER_COLORS, type Score } from "@/lib/types";

export function ScoreBadge({ score, compact }: { score: Score; compact?: boolean }) {
  const color = TIER_COLORS[score.tier];
  const tooltip = `Score ${score.score} · industry ${score.breakdown.industry} · size ${score.breakdown.size} · location ${score.breakdown.location} · role ${score.breakdown.role} · intent ${score.breakdown.intent}`;
  return (
    <span
      title={tooltip}
      className={`inline-flex items-center gap-1 rounded-full border ${
        compact ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-[11px]"
      } font-medium`}
      style={{ borderColor: color, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {score.tier}
      {!compact && (
        <span className="text-[10px] tabular-nums opacity-70">{score.score}</span>
      )}
    </span>
  );
}
