import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { AIChat } from "@/components/AIChat";
import { CapacityBadge } from "@/components/CapacityBadge";
import { CompanyLogo } from "@/components/Avatar";
import { Home as HomeIcon, CheckSquare, ArrowRight } from "lucide-react";
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
  const [queue, allDeals, allPeople, allCompanies] = await Promise.all([
    getDailyQueue(sdr.id, todayISO()),
    listDeals(),
    listPeople(),
    listCompanies(),
  ]);

  const openDeals = allDeals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const weighted = openDeals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0);
  const recentDeals = openDeals
    .slice()
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const recentDealCompanies = await Promise.all(
    recentDeals.map(async (d) => ({
      id: d.id,
      company: d.companyId ? await getCompany(d.companyId) : undefined,
    })),
  );
  const recentDealCompanyMap = new Map(recentDealCompanies.map((c) => [c.id, c.company]));

  return (
    <>
      <TopBar title="Home" icon={<HomeIcon size={14} />} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="page-enter mx-auto max-w-3xl px-6 py-12">
          <h1 className="mb-8 text-center text-[28px] font-semibold tracking-tight">
            {greeting()},{" "}
            <span style={{ color: "var(--accent-strong)" }}>{sdr.name.split(" ")[0]}</span>.
          </h1>

          <AIChat />

          <Section
            title="Your queue today"
            right={
              <Link
                href="/today"
                className="group/cta inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--muted-foreground)] hover:text-[var(--accent-strong)] transition-colors"
              >
                <CheckSquare size={12} />
                Open daily queue
                <ArrowRight
                  size={11}
                  className="opacity-0 -translate-x-1 transition-all duration-200 group-hover/cta:opacity-100 group-hover/cta:translate-x-0"
                />
              </Link>
            }
          >
            <CapacityBadge {...queue.capacity} />
            <div className="mt-3 text-[12.5px] text-[var(--muted-foreground)] flex items-center gap-3">
              {queue.overdue.length > 0 && (
                <span className="inline-flex items-center gap-1.5 font-medium text-[var(--danger)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--danger)] animate-pulse-soft" />
                  {queue.overdue.length} overdue
                </span>
              )}
              <span>{queue.dueToday.length} due today</span>
              <span>{queue.completedToday.length} completed</span>
            </div>
          </Section>

          <div className="mt-12 grid grid-cols-3 gap-3">
            <Stat label="Pipeline (weighted)" value={formatCurrency(weighted)} highlight />
            <Stat label="Companies" value={allCompanies.length.toString()} />
            <Stat label="Contacts" value={allPeople.length.toString()} />
          </div>

          <Section
            title={`Top open deals · ${openDeals.length}`}
            right={
              <Link
                href="/pipeline"
                className="group/cta inline-flex items-center gap-1 text-[12.5px] font-medium text-[var(--muted-foreground)] hover:text-[var(--accent-strong)] transition-colors"
              >
                View all
                <ArrowRight
                  size={11}
                  className="opacity-0 -translate-x-1 transition-all duration-200 group-hover/cta:opacity-100 group-hover/cta:translate-x-0"
                />
              </Link>
            }
          >
            <div
              className="overflow-hidden rounded-xl bg-[var(--surface)]"
              style={{
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-xs)",
              }}
            >
              {recentDeals.map((d, i) => {
                const company = recentDealCompanyMap.get(d.id);
                return (
                  <Link
                    key={d.id}
                    href={`/deals/${d.id}`}
                    className={`deal-row flex items-center gap-3 px-4 py-3 text-[13px] ${
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
                      <span className="pill">{STAGE_LABELS[d.stage]}</span>
                      <span className="tabular-nums font-medium text-[var(--foreground)]">
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

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="stat-card rounded-xl bg-[var(--surface)] px-4 py-3.5"
      style={{
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-xs)",
        ...(highlight
          ? {
              background:
                "linear-gradient(180deg, var(--accent-softer) 0%, var(--surface) 70%)",
            }
          : {}),
      }}
    >
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-1.5 text-[20px] font-semibold tabular-nums tracking-tight">
        {value}
      </div>
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
    <div className="mt-12">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[12.5px] font-semibold tracking-tight uppercase text-[var(--muted)] tracking-[0.06em]">
          {title}
        </h2>
        {right}
      </div>
      {children}
    </div>
  );
}
