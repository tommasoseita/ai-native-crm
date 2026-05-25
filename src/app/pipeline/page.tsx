import { TopBar } from "@/components/TopBar";
import { PageHeader } from "@/components/PageHeader";
import { ViewToolbar } from "@/components/ViewToolbar";
import { PipelineBoard } from "@/components/PipelineBoard";
import { deals } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

export default function PipelinePage() {
  const open = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const totalValue = open.reduce((sum, d) => sum + d.value, 0);
  const weighted = open.reduce(
    (sum, d) => sum + d.value * (d.probability / 100),
    0,
  );

  return (
    <>
      <TopBar
        title="Pipeline"
        icon={<TrendingUp size={14} className="text-orange-500" />}
      />
      <PageHeader
        icon={<TrendingUp size={14} className="text-orange-500" />}
        title="Pipeline"
        count={deals.length}
        description={`${open.length} open deals · ${formatCurrency(totalValue)} total · ${formatCurrency(weighted)} weighted`}
        primaryAction="Add deal"
      />
      <ViewToolbar views={["board", "table"]} activeView="board" />
      <PipelineBoard deals={deals} />
    </>
  );
}
