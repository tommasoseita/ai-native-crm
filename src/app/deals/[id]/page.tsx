import Link from "next/link";
import { notFound } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import {
  getDeal,
  getCompany,
  getPerson,
  contactsForDeal,
  listPeople,
} from "@/lib/queries";
import { teamMemberById } from "@/lib/types";
import { Avatar, CompanyLogo } from "@/components/Avatar";
import { DetailHeader, Panel, Prop, PropList } from "@/components/DetailHeader";
import { DealStageSelector } from "@/components/DealStageSelector";
import { DealContactsManager } from "@/components/DealContactsManager";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { deleteDeal } from "@/lib/actions";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = getDeal(id);
  if (!deal) notFound();

  const company = deal.companyId ? getCompany(deal.companyId) : undefined;
  const primary = deal.primaryContactId ? getPerson(deal.primaryContactId) : undefined;
  const associated = contactsForDeal(id);
  const owner = teamMemberById(deal.ownerId);
  const allPeople = listPeople();
  const weighted = deal.value * (deal.probability / 100);

  return (
    <>
      <TopBar
        title={deal.name}
        icon={<TrendingUp size={14} className="text-orange-500" />}
      />
      <DetailHeader
        backHref="/pipeline"
        backLabel="Pipeline"
        title={deal.name}
        icon={
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-100">
            <TrendingUp size={18} className="text-orange-500" />
          </div>
        }
        subtitle={
          <div className="flex items-center gap-4">
            <span className="text-[18px] font-semibold text-[var(--foreground)] tabular-nums">
              {formatCurrency(deal.value, deal.currency)}
            </span>
            <span>
              {deal.probability}% · weighted{" "}
              <span className="text-[var(--foreground)] tabular-nums">
                {formatCurrency(weighted, deal.currency)}
              </span>
            </span>
            {company && (
              <Link
                href={`/companies/${company.id}`}
                className="inline-flex items-center gap-1.5 hover:text-[var(--accent)]"
              >
                <CompanyLogo
                  name={company.name}
                  domain={company.domain ?? undefined}
                  size="xs"
                />
                {company.name}
              </Link>
            )}
          </div>
        }
        actions={
          <DeleteRecordButton
            label="Delete deal"
            action={async () => {
              "use server";
              await deleteDeal(id);
            }}
          />
        }
      />

      <div className="border-b border-[var(--border)] bg-white px-6 py-3">
        <DealStageSelector dealId={deal.id} current={deal.stage} />
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin">
        <div className="grid grid-cols-[280px_1fr] gap-6 px-6 py-5">
          <aside className="flex flex-col gap-4">
            <Panel title="Details">
              <div className="px-4 py-3">
                <PropList>
                  <Prop label="Value">
                    <span className="tabular-nums font-medium">
                      {formatCurrency(deal.value, deal.currency)}
                    </span>
                  </Prop>
                  <Prop label="Probability">{deal.probability}%</Prop>
                  <Prop label="Weighted">
                    <span className="tabular-nums">
                      {formatCurrency(weighted, deal.currency)}
                    </span>
                  </Prop>
                  <Prop label="Expected close">{formatDate(deal.expectedCloseDate)}</Prop>
                  <Prop label="Owner">
                    {owner ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar name={owner.name} color={owner.color} size="xs" />
                        <span>{owner.name}</span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </Prop>
                  <Prop label="Created">{formatDate(deal.createdAt)}</Prop>
                </PropList>
              </div>
            </Panel>

            <Panel title="Linked records">
              <div className="px-4 py-3 space-y-3">
                <div>
                  <div className="mb-1 text-[11px] uppercase tracking-wider text-[var(--muted)]">
                    Company
                  </div>
                  {company ? (
                    <Link
                      href={`/companies/${company.id}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      <CompanyLogo
                        name={company.name}
                        domain={company.domain ?? undefined}
                      />
                      <div>
                        <div className="text-[13px] font-medium">{company.name}</div>
                        {company.domain && (
                          <div className="text-[11px] text-[var(--muted)]">
                            {company.domain}
                          </div>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div className="text-[12px] text-[var(--muted)]">No company linked</div>
                  )}
                </div>
                <div className="border-t border-[var(--border)] pt-3">
                  <div className="mb-1 text-[11px] uppercase tracking-wider text-[var(--muted)]">
                    Primary contact
                  </div>
                  {primary ? (
                    <Link
                      href={`/people/${primary.id}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      <Avatar name={`${primary.firstName} ${primary.lastName}`} />
                      <div>
                        <div className="text-[13px] font-medium">
                          {primary.firstName} {primary.lastName}
                        </div>
                        {primary.role && (
                          <div className="text-[11px] text-[var(--muted)]">
                            {primary.role}
                          </div>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <div className="text-[12px] text-[var(--muted)]">
                      No primary contact
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          </aside>

          <div className="flex flex-col gap-4">
            <Panel title="Additional contacts" count={associated.length}>
              <DealContactsManager
                dealId={deal.id}
                primaryContactId={deal.primaryContactId}
                associated={associated}
                allPeople={allPeople}
              />
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}
