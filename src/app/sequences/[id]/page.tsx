import Link from "next/link";
import { notFound } from "next/navigation";
import { GitBranch, Phone } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { DetailHeader, EmptyRow, Panel, Prop, PropList } from "@/components/DetailHeader";
import { Avatar } from "@/components/Avatar";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import {
  getSequence,
  listSequenceSteps,
  enrollmentsForSequence,
  getPerson,
} from "@/lib/queries";
import { teamMemberById } from "@/lib/types";
import { deleteSequence } from "@/lib/actions";
import { formatDate } from "@/lib/utils";

export default async function SequenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seq = getSequence(id);
  if (!seq) notFound();

  const steps = listSequenceSteps(id);
  const enrollments = enrollmentsForSequence(id);
  const owner = teamMemberById(seq.ownerId);
  const byStatus = {
    active: enrollments.filter((e) => e.status === "active"),
    completed: enrollments.filter((e) => e.status === "completed"),
    exited: enrollments.filter((e) => e.status === "exited"),
  };

  return (
    <>
      <TopBar title={seq.name} icon={<GitBranch size={14} className="text-purple-500" />} />
      <DetailHeader
        backHref="/sequences"
        backLabel="Sequences"
        title={seq.name}
        icon={
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-purple-100">
            <GitBranch size={18} className="text-purple-500" />
          </div>
        }
        subtitle={seq.description ?? undefined}
        actions={
          <DeleteRecordButton
            label="Delete sequence"
            action={async () => {
              "use server";
              await deleteSequence(id);
            }}
          />
        }
      />

      <div className="flex-1 overflow-auto scrollbar-thin">
        <div className="grid grid-cols-[280px_1fr] gap-6 px-6 py-5">
          <aside className="flex flex-col gap-4">
            <Panel title="Details">
              <div className="px-4 py-3">
                <PropList>
                  <Prop label="Steps">{steps.length}</Prop>
                  <Prop label="Active">{byStatus.active.length}</Prop>
                  <Prop label="Completed">{byStatus.completed.length}</Prop>
                  <Prop label="Exited">{byStatus.exited.length}</Prop>
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
                  <Prop label="Created">{formatDate(seq.createdAt)}</Prop>
                </PropList>
              </div>
            </Panel>

            <Panel title="Steps" count={steps.length}>
              <ul className="divide-y divide-[var(--border)]">
                {steps.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 px-4 py-2 text-[13px]"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[11px] font-semibold text-[var(--accent)]">
                      {s.stepNumber}
                    </span>
                    <Phone size={12} className="text-[var(--muted)]" />
                    <span className="capitalize">{s.channel}</span>
                    <span className="ml-auto text-[12px] text-[var(--muted-foreground)] tabular-nums">
                      Day {s.dayOffset}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </aside>

          <div className="flex flex-col gap-4">
            <Panel title="Enrolled contacts" count={enrollments.length}>
              {enrollments.length === 0 ? (
                <EmptyRow>No contacts enrolled in this sequence yet.</EmptyRow>
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {enrollments.map((e) => {
                    const p = getPerson(e.personId);
                    const sdr = teamMemberById(e.sdrId);
                    if (!p) return null;
                    return (
                      <li
                        key={e.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--sidebar-hover)]"
                      >
                        <Link
                          href={`/people/${p.id}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <Avatar name={`${p.firstName} ${p.lastName}`} />
                          <span className="font-medium">
                            {p.firstName} {p.lastName}
                          </span>
                        </Link>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${statusClass(
                            e.status,
                          )}`}
                        >
                          {e.status}
                        </span>
                        {e.exitReason && (
                          <span className="text-[11px] text-[var(--muted)]">
                            ({e.exitReason})
                          </span>
                        )}
                        <span className="ml-auto flex items-center gap-3 text-[12px] text-[var(--muted-foreground)]">
                          {sdr && (
                            <div className="flex items-center gap-1.5">
                              <Avatar name={sdr.name} color={sdr.color} size="xs" />
                              {sdr.name}
                            </div>
                          )}
                          <span>{formatDate(e.enrolledAt)}</span>
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

function statusClass(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "completed":
      return "bg-blue-50 text-blue-700 border border-blue-200";
    case "exited":
      return "bg-slate-100 text-slate-600 border border-slate-200";
    default:
      return "bg-slate-50 text-slate-500 border border-slate-200";
  }
}
