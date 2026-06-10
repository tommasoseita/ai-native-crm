import { TopBar } from "@/components/TopBar";
import { PageHeader } from "@/components/PageHeader";
import { ViewToolbar } from "@/components/ViewToolbar";
import { PipelineBoard } from "@/components/PipelineBoard";
import { NewDealButton } from "@/components/NewDealButton";
import { listCompanies, listDeals, listPeople } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

export default async function PipelinePage() {
  const [deals, companies, people] = await Promise.all([
    listDeals(),
    listCompanies(),
    listPeople(),
  ]);
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
        description={`${open.length} open · ${formatCurrency(totalValue)} total · ${formatCurrency(weighted)} weighted`}
        action={<NewDealButton companies={companies} people={people} />}
      />
      <ViewToolbar views={["board", "table"]} activeView="board" />
      <PipelineBoard initialDeals={deals} companies={companies} people={people} />
    </>
  );
}
