import Link from "next/link";
import { notFound } from "next/navigation";
import { Building, Globe, MapPin, Users } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import {
  getCompany,
  peopleByCompany,
  dealsByCompany,
  listCompanies,
  listPeople,
} from "@/lib/queries";
import { teamMemberById } from "@/lib/types";
import { Avatar, CompanyLogo } from "@/components/Avatar";
import { DetailHeader, EmptyRow, Panel, Prop, PropList } from "@/components/DetailHeader";
import { StagePill } from "@/components/StagePill";
import { formatCurrency, formatDate } from "@/lib/utils";
import { NewPersonButton } from "@/components/NewPersonButton";
import { NewDealButton } from "@/components/NewDealButton";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { deleteCompany } from "@/lib/actions";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [company, allCompanies, allPeople, people, deals] = await Promise.all([
    getCompany(id),
    listCompanies(),
    listPeople(),
    peopleByCompany(id),
    dealsByCompany(id),
  ]);
  if (!company) notFound();

  const owner = teamMemberById(company.ownerId);
  const openDealValue = deals
    .filter((d) => d.stage !== "won" && d.stage !== "lost")
    .reduce((sum, d) => sum + d.value, 0);

  return (
    <>
      <TopBar title={company.name} icon={<Building size={14} className="text-blue-500" />} />
      <DetailHeader
        backHref="/companies"
        backLabel="Companies"
        title={company.name}
        icon={<CompanyLogo name={company.name} domain={company.domain ?? undefined} size="lg" />}
        subtitle={
          <div className="flex items-center gap-3">
            {company.domain && (
              <a
                href={`https://${company.domain}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-[var(--accent)]"
              >
                <Globe size={11} />
                {company.domain}
              </a>
            )}
            {company.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={11} />
                {company.location}
              </span>
            )}
            {company.industry && <span>{company.industry}</span>}
          </div>
        }
        actions={
          <DeleteRecordButton
            label="Delete company"
            action={async () => {
              "use server";
              await deleteCompany(id);
            }}
          />
        }
      />

      <div className="flex-1 overflow-auto scrollbar-thin">
        <div className="grid grid-cols-[280px_1fr] gap-6 px-6 py-5">
          <aside>
            <Panel title="About">
              <div className="px-4 py-3">
                <PropList>
                  <Prop label="Industry">{company.industry ?? "—"}</Prop>
                  <Prop label="Size">{company.size ?? "—"}</Prop>
                  <Prop label="Location">{company.location ?? "—"}</Prop>
                  <Prop label="ARR">
                    {company.arr ? (
                      <span className="font-medium tabular-nums">
                        {formatCurrency(company.arr)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </Prop>
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
                  <Prop label="Created">{formatDate(company.createdAt)}</Prop>
                  <Prop label="Open deals">
                    <span className="tabular-nums">
                      {deals.filter((d) => d.stage !== "won" && d.stage !== "lost").length}
                    </span>
                    {openDealValue > 0 && (
                      <span className="ml-2 text-[11px] text-[var(--muted)]">
                        {formatCurrency(openDealValue)}
                      </span>
                    )}
                  </Prop>
                  <Prop label="Contacts">
                    <span className="tabular-nums">{people.length}</span>
                  </Prop>
                </PropList>
                {company.description && (
                  <p className="mt-4 border-t border-[var(--border)] pt-3 text-[12.5px] text-[var(--muted-foreground)] leading-relaxed">
                    {company.description}
                  </p>
                )}
              </div>
            </Panel>
          </aside>

          <div className="flex flex-col gap-4">
            <Panel
              title="Contacts"
              count={people.length}
              action={
                <NewPersonButton
                  companies={allCompanies}
                  defaultCompanyId={company.id}
                  label="Add contact"
                />
              }
            >
              {people.length === 0 ? (
                <EmptyRow>
                  <Users size={16} className="mx-auto mb-1 text-[var(--muted)]" />
                  No contacts yet at this company.
                </EmptyRow>
              ) : (
                <ul>
                  {people.map((p, i) => (
                    <li
                      key={p.id}
                      className={`flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--sidebar-hover)] ${
                        i !== people.length - 1 ? "border-b border-[var(--border)]" : ""
                      }`}
                    >
                      <Link
                        href={`/people/${p.id}`}
                        className="flex items-center gap-2 hover:underline"
                      >
                        <Avatar name={`${p.firstName} ${p.lastName}`} />
                        <span className="text-[13px] font-medium">
                          {p.firstName} {p.lastName}
                        </span>
                      </Link>
                      {p.role && (
                        <span className="text-[12px] text-[var(--muted-foreground)]">
                          {p.role}
                        </span>
                      )}
                      <a
                        href={`mailto:${p.email}`}
                        className="ml-auto text-[12px] text-[var(--muted-foreground)] hover:text-[var(--accent)]"
                      >
                        {p.email}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              title="Deals"
              count={deals.length}
              action={
                <NewDealButton
                  companies={allCompanies}
                  people={allPeople}
                  defaultCompanyId={company.id}
                  label="Add deal"
                />
              }
            >
              {deals.length === 0 ? (
                <EmptyRow>No deals yet with this company.</EmptyRow>
              ) : (
                <ul>
                  {deals.map((d, i) => (
                    <li
                      key={d.id}
                      className={`flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--sidebar-hover)] ${
                        i !== deals.length - 1 ? "border-b border-[var(--border)]" : ""
                      }`}
                    >
                      <Link href={`/deals/${d.id}`} className="font-medium hover:underline">
                        {d.name}
                      </Link>
                      <StagePill stage={d.stage} />
                      <span className="ml-auto flex items-center gap-3 text-[12px] text-[var(--muted-foreground)]">
                        <span className="tabular-nums font-medium text-[var(--foreground)]">
                          {formatCurrency(d.value, d.currency)}
                        </span>
                        <span>{formatDate(d.expectedCloseDate)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}

