import { CheckSquare, Lightbulb } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { PageHeader } from "@/components/PageHeader";
import { CapacityBadge } from "@/components/CapacityBadge";
import { TaskRow } from "@/components/TaskRow";
import { EnrollButton } from "@/components/EnrollButton";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Avatar, CompanyLogo } from "@/components/Avatar";
import { Panel, EmptyRow } from "@/components/DetailHeader";
import {
  getDailyQueue,
  enrollmentCapacity,
  suggestEnrollments,
} from "@/lib/cadence";
import { getCompany, getPerson, listSequences } from "@/lib/queries";
import { currentSdr } from "@/lib/viewAs";
import { todayISO } from "@/lib/utils";

export default async function TodayPage() {
  const sdr = await currentSdr();
  const date = todayISO();
  const [queue, capInfo, suggestions, sequences] = await Promise.all([
    getDailyQueue(sdr.id, date),
    enrollmentCapacity(sdr.id, date),
    suggestEnrollments(sdr.id, date),
    listSequences(),
  ]);
  const defaultSequence = sequences[0];

  const rampUp = queue.capacity.cap > 0 && queue.capacity.used + queue.capacity.pending < queue.capacity.cap * 0.6;

  const overdueData = await Promise.all(
    queue.overdue.map(async (t) => {
      const person = await getPerson(t.personId);
      const company = person?.companyId ? await getCompany(person.companyId) : undefined;
      return { id: t.id, person, company };
    }),
  );
  const overdueMap = new Map(overdueData.map((d) => [d.id, d]));

  const dueTodayData = await Promise.all(
    queue.dueToday.map(async (t) => {
      const person = await getPerson(t.personId);
      const company = person?.companyId ? await getCompany(person.companyId) : undefined;
      return { id: t.id, person, company };
    }),
  );
  const dueTodayMap = new Map(dueTodayData.map((d) => [d.id, d]));

  const suggestionCompanies = await Promise.all(
    suggestions.map(async ({ person }) => ({
      id: person.id,
      company: person.companyId ? await getCompany(person.companyId) : undefined,
    })),
  );
  const suggestionCompanyMap = new Map(suggestionCompanies.map((c) => [c.id, c.company]));

  const completedData = await Promise.all(
    queue.completedToday.map(async (t) => {
      const person = await getPerson(t.personId);
      return { id: t.id, person };
    }),
  );
  const completedMap = new Map(completedData.map((d) => [d.id, d]));

  return (
    <>
      <TopBar title="Today" icon={<CheckSquare size={14} className="text-emerald-500" />} />
      <PageHeader
        icon={<CheckSquare size={14} className="text-emerald-500" />}
        title="Today"
        description={`Your daily queue · ${date}`}
      />

      <div className="flex-1 overflow-auto scrollbar-thin">
        <div className="mx-auto max-w-4xl px-6 py-5 flex flex-col gap-4">
          <CapacityBadge {...queue.capacity} />

          {rampUp && (
            <div className="flex items-start gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2.5">
              <Lightbulb size={14} className="mt-0.5 text-amber-500 shrink-0" />
              <div className="text-[12.5px] text-amber-900">
                <span className="font-medium">Ramp-up mode.</span> Your queue is under {Math.round(queue.capacity.cap * 0.6)} tasks. Enroll up to <span className="font-medium">{capInfo.recommended} new contacts</span> today to fill the funnel. Steady state for this cap is ~{capInfo.steadyState}/day.
              </div>
            </div>
          )}

          {queue.overdue.length > 0 && (
            <Panel title="Overdue" count={queue.overdue.length}>
              <ul className="divide-y divide-[var(--border)]">
                {queue.overdue.map((t) => {
                  const data = overdueMap.get(t.id);
                  const person = data?.person;
                  if (!person) return null;
                  const company = data?.company;
                  return (
                    <li key={t.id}>
                      <TaskRow task={t} person={person} company={company} variant="overdue" />
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}

          <Panel title="Due today" count={queue.dueToday.length}>
            {queue.dueToday.length === 0 ? (
              <EmptyRow>No tasks due today.</EmptyRow>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {queue.dueToday.map((t) => {
                  const data = dueTodayMap.get(t.id);
                  const person = data?.person;
                  if (!person) return null;
                  const company = data?.company;
                  return (
                    <li key={t.id}>
                      <TaskRow task={t} person={person} company={company} />
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {capInfo.recommended > 0 && defaultSequence && (
            <Panel
              title="Suggested enrollments"
              count={suggestions.length}
              action={
                <span className="text-[11px] text-[var(--muted)]">
                  Recommended: {capInfo.recommended} · steady state {capInfo.steadyState}/day
                </span>
              }
            >
              {suggestions.length === 0 ? (
                <EmptyRow>Everyone is already enrolled. Add more contacts to keep enrolling.</EmptyRow>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {suggestions.map(({ person, score }) => {
                    const company = suggestionCompanyMap.get(person.id);
                    return (
                      <li
                        key={person.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--sidebar-hover)]"
                      >
                        <Avatar name={`${person.firstName} ${person.lastName}`} />
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium">
                            {person.firstName} {person.lastName}
                          </span>
                          <span className="text-[11px] text-[var(--muted)]">
                            {person.role ?? "—"}
                          </span>
                        </div>
                        {company && (
                          <div className="flex items-center gap-1.5 ml-2 text-[12px] text-[var(--muted-foreground)]">
                            <CompanyLogo name={company.name} domain={company.domain ?? undefined} size="xs" />
                            <span>{company.name}</span>
                          </div>
                        )}
                        <ScoreBadge score={score} />
                        <div className="ml-auto">
                          <EnrollButton
                            personId={person.id}
                            sequenceId={defaultSequence.id}
                            sdrId={sdr.id}
                            label="Enroll"
                            variant="primary"
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          )}

          {queue.completedToday.length > 0 && (
            <Panel title="Completed today" count={queue.completedToday.length}>
              <ul className="divide-y divide-[var(--border)]">
                {queue.completedToday.map((t) => {
                  const person = completedMap.get(t.id)?.person;
                  if (!person) return null;
                  return (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 px-4 py-2 text-[12.5px]"
                    >
                      <Avatar name={`${person.firstName} ${person.lastName}`} size="xs" />
                      <span className="font-medium">
                        {person.firstName} {person.lastName}
                      </span>
                      <span className="text-[var(--muted)]">step {t.stepNumber}</span>
                      <span className="ml-auto rounded-full bg-[var(--sidebar-hover)] px-2 py-0.5 text-[11px] text-[var(--muted-foreground)]">
                        {t.status === "completed" ? t.outcome ?? "completed" : "skipped"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
