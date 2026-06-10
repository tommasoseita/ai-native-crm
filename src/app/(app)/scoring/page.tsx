import { Sliders } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { PageHeader } from "@/components/PageHeader";
import { ScoringForm } from "@/components/ScoringForm";
import { getScoringConfig } from "@/lib/queries";

export default async function ScoringPage() {
  const config = await getScoringConfig();
  return (
    <>
      <TopBar title="Scoring rules" icon={<Sliders size={14} />} />
      <PageHeader
        icon={<Sliders size={14} className="text-[var(--accent)]" />}
        title="Scoring rules"
        description="Weights and thresholds that determine each contact's lead tier (A / B / C)."
      />
      <div className="flex-1 overflow-auto scrollbar-thin">
        <div className="mx-auto max-w-3xl px-6 py-5">
          <ScoringForm initial={config} />
        </div>
      </div>
    </>
  );
}
