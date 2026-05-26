import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { AIPromptBar } from "@/components/AIPromptBar";
import { CapacityBadge } from "@/components/CapacityBadge";
import { CompanyLogo } from "@/components/Avatar";
import { Home as HomeIcon, CheckSquare } from "lucide-react";
import {
  listCompanies,
  listDeals,
  listPeople,
  getCompany,
} from "@/lib/queries";
import { getDailyQueue } from "@/lib/cadence";
import { currentSdr } from "@/lib/viewAs";
import { formatCurrency, formatDate, today, todayISO } from "@/lib/utils";
import { STAGE_LABELS } from "@/lib/types";

function greeting() {
  const h = today().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function HomePage() {
  const sdr = await currentSdr();
  const queue = getDailyQueue(sdr.id, todayISO());
  const allDeals = listDeals();
  const allPeople = listPeople();
  const allCompanies = listCompanies();

  const openDeals = allDeals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const weighted = openDeals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0);
  const recentDeals = openDeals
    .slice()
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <>
      <TopBar title="Home" icon={<HomeIcon size={14} />} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="mb-6 text-center text-[26px] font-semibold tracking-tight">
            {greeting()}, {sdr.name.split(" ")[0]}.
          </h1>

          <AIPromptBar />

          <Section
            title="Your queue today"
            right={
              <Link
                href="/today"
                className="inline-flex items-center gap-1 text-[12px] text-[var(--muted-foreground)] hover:underline"
              >
                <CheckSquare size={11} />
                Open daily queue
              </Link>
            }
          >
            <CapacityBadge {...queue.capacity} />
            <div className="mt-2 text-[12px] text-[var(--muted-foreground)]">
              {queue.overdue.length > 0 && (
                <span className="text-red-600">
                  {queue.overdue.length} overdue ·{" "}
                </span>
              )}
              {queue.dueToday.length} due today · {queue.completedToday.length} completed
            </div>
          </Section>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <Stat label="Pipeline (weighted)" value={formatCurrency(weighted)} />
            <Stat label="Companies" value={allCompanies.length.toString()} />
            <Stat label="Contacts" value={allPeople.length.toString()} />
          </div>

          <Section
            title={`Top open deals · ${openDeals.length}`}
            right={
              <Link
                href="/pipeline"
                className="text-[12px] text-[var(--muted-foreground)] hover:underline"
              >
                View all
              </Link>
            }
          >
            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white">
              {recentDeals.map((d, i) => {
                const company = d.companyId ? getCompany(d.companyId) : undefined;
                return (
                  <Link
                    key={d.id}
                    href={`/deals/${d.id}`}
                    className={`flex items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-[var(--sidebar-hover)] ${
                      i !== recentDeals.length - 1 ? "border-b border-[var(--border)]" : ""
                    }`}
                  >
                    {company && (
                      <CompanyLogo
                        name={company.name}
                        domain={company.domain ?? undefined}
                        size="xs"
                      />
                    )}
                    <span className="font-medium truncate">{d.name}</span>
                    <span className="ml-auto flex items-center gap-3 text-[12px] text-[var(--muted-foreground)]">
                      <span className="rounded-full bg-[var(--sidebar-hover)] px-2 py-0.5 text-[11px]">
                        {STAGE_LABELS[d.stage]}
                      </span>
                      <span className="tabular-nums">
                        {formatCurrency(d.value, d.currency)}
                      </span>
                      <span>{formatDate(d.expectedCloseDate)}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">{label}</div>
      <div className="mt-1 text-[18px] font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-10">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[13px] font-medium">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}
