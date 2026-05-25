import Link from "next/link";
import { notFound } from "next/navigation";
import { Link2, Mail, Phone, User } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import {
  getPerson,
  getCompany,
  dealsByPrimaryContact,
  dealsByContact,
  listCompanies,
  listPeople,
} from "@/lib/queries";
import { teamMemberById } from "@/lib/types";
import { Avatar, CompanyLogo } from "@/components/Avatar";
import { DetailHeader, EmptyRow, Panel, Prop, PropList } from "@/components/DetailHeader";
import { StagePill } from "@/components/StagePill";
import { formatCurrency, formatDate, relativeTime } from "@/lib/utils";
import { NewDealButton } from "@/components/NewDealButton";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { deletePerson } from "@/lib/actions";

const TODAY = new Date("2026-05-25");

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = getPerson(id);
  if (!person) notFound();

  const company = person.companyId ? getCompany(person.companyId) : undefined;
  const owner = teamMemberById(person.ownerId);
  const primaryDeals = dealsByPrimaryContact(id);
  const associatedDeals = dealsByContact(id).filter(
    (d) => !primaryDeals.some((pd) => pd.id === d.id),
  );
  const allDeals = [...primaryDeals, ...associatedDeals];
  const companies = listCompanies();
  const people = listPeople();

  return (
    <>
      <TopBar
        title={`${person.firstName} ${person.lastName}`}
        icon={<User size={14} className="text-sky-500" />}
      />
      <DetailHeader
        backHref="/people"
        backLabel="Contacts"
        title={`${person.firstName} ${person.lastName}`}
        icon={<Avatar name={`${person.firstName} ${person.lastName}`} size="lg" />}
        subtitle={
          <div className="flex items-center gap-3">
            {person.role && <span>{person.role}</span>}
            {company && (
              <Link
                href={`/companies/${company.id}`}
                className="inline-flex items-center gap-1 hover:text-[var(--accent)]"
              >
                <CompanyLogo name={company.name} domain={company.domain ?? undefined} size="xs" />
                {company.name}
              </Link>
            )}
          </div>
        }
        actions={
          <DeleteRecordButton
            label="Delete contact"
            action={async () => {
              "use server";
              await deletePerson(id);
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
                  <Prop label="Email">
                    <a
                      href={`mailto:${person.email}`}
                      className="inline-flex items-center gap-1 hover:text-[var(--accent)]"
                    >
                      <Mail size={11} /> {person.email}
                    </a>
                  </Prop>
                  <Prop label="Phone">
                    {person.phone ? (
                      <a
                        href={`tel:${person.phone}`}
                        className="inline-flex items-center gap-1 hover:text-[var(--accent)]"
                      >
                        <Phone size={11} /> {person.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </Prop>
                  <Prop label="LinkedIn">
                    {person.linkedin ? (
                      <a
                        href={`https://${person.linkedin.replace(/^https?:\/\//, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-[var(--accent)]"
                      >
                        <Link2 size={11} /> {person.linkedin}
                      </a>
                    ) : (
                      "—"
                    )}
                  </Prop>
                  <Prop label="Role">{person.role ?? "—"}</Prop>
                  <Prop label="Company">
                    {company ? (
                      <Link
                        href={`/companies/${company.id}`}
                        className="inline-flex items-center gap-1.5 hover:underline"
                      >
                        <CompanyLogo
                          name={company.name}
                          domain={company.domain ?? undefined}
                          size="xs"
                        />
                        {company.name}
                      </Link>
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
                  <Prop label="Last contacted">
                    {relativeTime(person.lastContactedAt ?? undefined, TODAY)}
                  </Prop>
                  <Prop label="Created">{formatDate(person.createdAt)}</Prop>
                </PropList>
              </div>
            </Panel>
          </aside>

          <div className="flex flex-col gap-4">
            <Panel
              title="Deals"
              count={allDeals.length}
              action={
                <NewDealButton
                  companies={companies}
                  people={people}
                  defaultCompanyId={company?.id}
                  defaultContactId={person.id}
                  label="Add deal"
                />
              }
            >
              {allDeals.length === 0 ? (
                <EmptyRow>No deals linked to this contact.</EmptyRow>
              ) : (
                <ul>
                  {allDeals.map((d, i) => {
                    const dealCompany = d.companyId ? getCompany(d.companyId) : undefined;
                    const isPrimary = primaryDeals.some((pd) => pd.id === d.id);
                    return (
                      <li
                        key={d.id}
                        className={`flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--sidebar-hover)] ${
                          i !== allDeals.length - 1 ? "border-b border-[var(--border)]" : ""
                        }`}
                      >
                        {dealCompany && (
                          <CompanyLogo
                            name={dealCompany.name}
                            domain={dealCompany.domain ?? undefined}
                            size="xs"
                          />
                        )}
                        <Link
                          href={`/deals/${d.id}`}
                          className="font-medium hover:underline"
                        >
                          {d.name}
                        </Link>
                        <StagePill stage={d.stage} />
                        {!isPrimary && (
                          <span className="rounded-full bg-[var(--sidebar-hover)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
                            associated
                          </span>
                        )}
                        <span className="ml-auto flex items-center gap-3 text-[12px] text-[var(--muted-foreground)]">
                          <span className="tabular-nums font-medium text-[var(--foreground)]">
                            {formatCurrency(d.value, d.currency)}
                          </span>
                          <span>{formatDate(d.expectedCloseDate)}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      </div>
    </>
  );
}
