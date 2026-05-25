import { TopBar } from "@/components/TopBar";
import { AIPromptBar } from "@/components/AIPromptBar";
import {
  Home as HomeIcon,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { deals, people, companies } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

const TODAY = new Date("2026-05-25T14:30:00");

function greeting() {
  const h = TODAY.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const myDeals = deals
    .filter((d) => d.ownerId === "u1" && d.stage !== "won" && d.stage !== "lost")
    .slice(0, 4);

  const pipelineValue = deals
    .filter((d) => d.stage !== "lost")
    .reduce((sum, d) => sum + d.value * (d.probability / 100), 0);

  return (
    <>
      <TopBar title="Home" icon={<HomeIcon size={14} />} />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="mb-6 text-center text-[26px] font-semibold tracking-tight">
            {greeting()}, Tommaso.
          </h1>

          <AIPromptBar />

          <div className="mt-12 grid grid-cols-3 gap-3">
            <Stat label="Pipeline (weighted)" value={formatCurrency(pipelineValue)} delta="+12%" />
            <Stat label="People" value={people.length.toString()} delta="+3 this week" />
            <Stat label="Companies" value={companies.length.toString()} delta="+1 this week" />
          </div>

          <Section
            title="Meetings"
            right={
              <div className="flex items-center gap-1 text-[12px] text-[var(--muted-foreground)]">
                <span>Today, May 25</span>
                <button className="rounded p-0.5 hover:bg-[var(--sidebar-hover)]">
                  <ChevronLeft size={13} />
                </button>
                <button className="rounded p-0.5 hover:bg-[var(--sidebar-hover)]">
                  <ChevronRight size={13} />
                </button>
                <button className="rounded p-0.5 hover:bg-[var(--sidebar-hover)]">
                  <MoreHorizontal size={13} />
                </button>
              </div>
            }
          >
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-white p-8 text-center">
              <Calendar size={20} className="mx-auto mb-2 text-[var(--muted)]" />
              <p className="text-[13px] font-medium">Turn meetings into opportunities</p>
              <p className="mt-0.5 text-[12px] text-[var(--muted-foreground)]">
                Sync your calendar to get instant meeting context
              </p>
              <button className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-[12px] font-medium hover:bg-[var(--sidebar-hover)]">
                <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-white">
                  <span className="text-[10px] font-bold text-blue-500">G</span>
                </span>
                Sync Google Account
              </button>
            </div>
          </Section>

          <Section
            title={`My open deals · ${myDeals.length}`}
            right={
              <a href="/pipeline" className="text-[12px] text-[var(--muted-foreground)] hover:underline">
                View all
              </a>
            }
          >
            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white">
              {myDeals.map((d, i) => (
                <a
                  key={d.id}
                  href="/pipeline"
                  className={`flex items-center gap-3 px-4 py-2.5 text-[13px] hover:bg-[var(--sidebar-hover)] ${
                    i !== myDeals.length - 1 ? "border-b border-[var(--border)]" : ""
                  }`}
                >
                  <span className="font-medium truncate">{d.name}</span>
                  <span className="ml-auto flex items-center gap-3 text-[12px] text-[var(--muted-foreground)]">
                    <span className="rounded-full bg-[var(--sidebar-hover)] px-2 py-0.5 text-[11px] capitalize">
                      {d.stage}
                    </span>
                    <span className="tabular-nums">{formatCurrency(d.value, d.currency)}</span>
                    <span>{formatDate(d.expectedCloseDate)}</span>
                  </span>
                </a>
              ))}
            </div>
          </Section>

          <Section
            title="Tasks 0"
            right={<span className="text-[12px] text-[var(--muted-foreground)]">View all</span>}
          >
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-white p-8 text-center">
              <CheckSquare size={20} className="mx-auto mb-2 text-[var(--muted)]" />
              <p className="text-[13px] font-medium">Stay on top of work</p>
              <p className="mt-0.5 text-[12px] text-[var(--muted-foreground)]">
                Create tasks for yourself or your team to track next steps
              </p>
              <button className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-[12px] font-medium hover:bg-[var(--sidebar-hover)]">
                <Plus size={12} />
                New task
              </button>
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
  delta,
}: {
  label: string;
  value: string;
  delta?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">{label}</div>
      <div className="mt-1 text-[18px] font-semibold tabular-nums">{value}</div>
      {delta && <div className="mt-0.5 text-[11px] text-emerald-600">{delta}</div>}
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
