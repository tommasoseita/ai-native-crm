import Link from "next/link";
import { notFound } from "next/navigation";
import { Link2, Mail, Phone, User, Zap } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import {
  getPerson,
  getCompany,
  dealsByPrimaryContact,
  dealsByContact,
  listCompanies,
  listPeople,
  activeEnrollmentForPerson,
  tasksForEnrollment,
  getSequence,
  listSequences,
  getScoringConfig,
} from "@/lib/queries";
import { scorePerson } from "@/lib/scoring";
import { teamMemberById } from "@/lib/types";
import { Avatar, CompanyLogo } from "@/components/Avatar";
import { DetailHeader, EmptyRow, Panel, Prop, PropList } from "@/components/DetailHeader";
import { ScoreBadge } from "@/components/ScoreBadge";
import { StagePill } from "@/components/StagePill";
import { EnrollButton } from "@/components/EnrollButton";
import { formatCurrency, formatDate, relativeTime, today, todayISO } from "@/lib/utils";
import { NewDealButton } from "@/components/NewDealButton";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { deletePerson, exitEnrollment } from "@/lib/actions";
import { currentSdrId } from "@/lib/viewAs";

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = await getPerson(id);
  if (!person) notFound();

  const [
    company,
    primaryDeals,
    associatedDealsRaw,
    companies,
    people,
    sequences,
    config,
    activeEnr,
  ] = await Promise.all([
    person.companyId ? getCompany(person.companyId) : Promise.resolve(undefined),
    dealsByPrimaryContact(id),
    dealsByContact(id),
    listCompanies(),
    listPeople(),
    listSequences(),
    getScoringConfig(),
    activeEnrollmentForPerson(id),
  ]);
  const owner = teamMemberById(person.ownerId);
  const associatedDeals = associatedDealsRaw.filter(
    (d) => !primaryDeals.some((pd) => pd.id === d.id),
  );
  const allDeals = [...primaryDeals, ...associatedDeals];
  const defaultSequence = sequences[0];

  const score = scorePerson(person, company, config, today());

  const [enrSequence, enrTasks, sdrForEnroll] = await Promise.all([
    activeEnr ? getSequence(activeEnr.sequenceId) : Promise.resolve(undefined),
    activeEnr ? tasksForEnrollment(activeEnr.id) : Promise.resolve([]),
    currentSdrId(),
  ]);
  const todayStr = todayISO();
  const nextTask = enrTasks.find((t) => t.status === "pending");

  const dealCompanyEntries = await Promise.all(
    allDeals.map(async (d) => {
      const dealCompany = d.companyId ? await getCompany(d.companyId) : undefined;
      return [d.id, dealCompany] as const;
    }),
  );
  const dealCompanyMap = new Map(dealCompanyEntries);

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
            <ScoreBadge score={score} />
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
          <>
            {!activeEnr && defaultSequence && (
              <EnrollButton
                personId={person.id}
                sequenceId={defaultSequence.id}
                sdrId={sdrForEnroll}
                label="Enroll in sequence"
                variant="primary"
              />
            )}
            <DeleteRecordButton
              label="Delete contact"
              action={async () => {
                "use server";
                await deletePerson(id);
              }}
            />
          </>
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
                  <Prop label="Lead score">
                    <span className="tabular-nums">{score.score}</span>
                  </Prop>
                  <Prop label="Last contacted">
                    {relativeTime(person.lastContactedAt, today())}
                  </Prop>
                  <Prop label="Last engaged">
                    {relativeTime(person.lastEngagedAt, today())}
                  </Prop>
                  <Prop label="Created">{formatDate(person.createdAt)}</Prop>
                </PropList>
              </div>
            </Panel>
          </aside>

          <div className="flex flex-col gap-4">
            {activeEnr && enrSequence && (
              <Panel
                title="Active enrollment"
                action={
                  <form
                    action={async () => {
                      "use server";
                      await exitEnrollment(activeEnr.id, "manual");
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[11.5px] text-[var(--muted-foreground)] hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                    >
                      Exit sequence
                    </button>
                  </form>
                }
              >
                <div className="px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px]">
                  <div className="flex items-center gap-1.5">
                    <Zap size={13} className="text-[var(--accent)]" />
                    <Link
                      href={`/sequences/${enrSequence.id}`}
                      className="font-medium hover:underline"
                    >
                      {enrSequence.name}
                    </Link>
                  </div>
                  <div>
                    <span className="text-[var(--muted)]">Enrolled</span>{" "}
                    {formatDate(activeEnr.enrolledAt)}
                  </div>
                  {nextTask && (
                    <div>
                      <span className="text-[var(--muted)]">Next step</span>{" "}
                      <span className="font-medium">#{nextTask.stepNumber}</span> due{" "}
                      <span className={nextTask.dueDate < todayStr ? "text-red-600" : ""}>
                        {formatDate(nextTask.dueDate)}
                      </span>
                    </div>
                  )}
                </div>
                <ul className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
                  {enrTasks.map((t) => {
                    const isOverdue = t.status === "pending" && t.dueDate < todayStr;
                    return (
                      <li
                        key={t.id}
                        className={`flex items-center gap-3 px-4 py-2 text-[12.5px] ${
                          isOverdue ? "bg-red-50/40" : ""
                        }`}
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--sidebar-hover)] text-[11px] font-semibold text-[var(--muted-foreground)]">
                          {t.stepNumber}
                        </span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10.5px] ${
                            t.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : t.status === "skipped"
                                ? "bg-slate-100 text-slate-600 border border-slate-200"
                                : isOverdue
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {t.status}
                        </span>
                        {t.outcome && (
                          <span className="text-[11px] text-[var(--muted-foreground)]">
                            {t.outcome.replace(/_/g, " ")}
                          </span>
                        )}
                        <span className="ml-auto text-[11px] tabular-nums text-[var(--muted)]">
                          {formatDate(t.dueDate)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            )}

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
                    const dealCompany = dealCompanyMap.get(d.id);
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
