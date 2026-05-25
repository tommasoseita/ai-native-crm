import { STAGES, type Deal } from "@/lib/types";
import { companyById, personById, teamMemberById } from "@/lib/data";
import { Avatar, CompanyLogo } from "./Avatar";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Calendar, Plus } from "lucide-react";

export function PipelineBoard({ deals }: { deals: Deal[] }) {
  return (
    <div className="flex-1 overflow-x-auto scrollbar-thin bg-[var(--sidebar)]">
      <div className="flex h-full gap-3 px-4 py-4 min-w-max">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id);
          const total = stageDeals.reduce((sum, d) => sum + d.value, 0);
          return (
            <div
              key={stage.id}
              className="flex w-[280px] shrink-0 flex-col rounded-xl bg-white border border-[var(--border)]"
            >
              <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: stage.color }}
                />
                <span className="text-[12.5px] font-medium">{stage.label}</span>
                <span className="text-[11px] text-[var(--muted)]">
                  {stageDeals.length}
                </span>
                <span className="ml-auto text-[11px] tabular-nums text-[var(--muted-foreground)]">
                  {formatCurrency(total)}
                </span>
                <button className="rounded p-0.5 hover:bg-[var(--sidebar-hover)]">
                  <Plus size={12} className="text-[var(--muted)]" />
                </button>
              </div>
              <div className="flex flex-col gap-2 p-2 overflow-y-auto scrollbar-thin">
                {stageDeals.map((d) => (
                  <DealCard key={d.id} deal={d} />
                ))}
                {stageDeals.length === 0 && (
                  <div className="rounded-md border border-dashed border-[var(--border)] px-3 py-6 text-center text-[11px] text-[var(--muted)]">
                    Drop deals here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  const company = companyById(deal.companyId);
  const contact = personById(deal.primaryContactId);
  const owner = teamMemberById(deal.ownerId);

  return (
    <div className="group cursor-pointer rounded-md border border-[var(--border)] bg-white p-2.5 hover:border-[var(--accent)]/40 hover:shadow-[0_1px_4px_rgba(0,0,0,0.05)] transition-all">
      <div className="flex items-start gap-2">
        {company && <CompanyLogo name={company.name} domain={company.domain} />}
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-medium leading-tight truncate">
            {deal.name}
          </div>
          {company && (
            <div className="mt-0.5 text-[11px] text-[var(--muted)] truncate">
              {company.name}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[13px] font-semibold tabular-nums">
          {formatCurrency(deal.value, deal.currency)}
        </span>
        <div className="flex items-center gap-1 text-[10.5px] text-[var(--muted)]">
          <Calendar size={10} />
          {formatDate(deal.expectedCloseDate)}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-[var(--border)] pt-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {contact && (
            <>
              <Avatar
                name={`${contact.firstName} ${contact.lastName}`}
                size="xs"
              />
              <span className="text-[11px] text-[var(--muted-foreground)] truncate">
                {contact.firstName} {contact.lastName}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-[var(--muted)]">{deal.probability}%</span>
          {owner && <Avatar name={owner.name} color={owner.color} size="xs" />}
        </div>
      </div>
    </div>
  );
}
