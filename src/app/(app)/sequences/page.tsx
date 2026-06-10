import Link from "next/link";
import { GitBranch } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { PageHeader } from "@/components/PageHeader";
import { NewSequenceButton } from "@/components/NewSequenceButton";
import { listSequences, listSequenceSteps, enrollmentsForSequence } from "@/lib/queries";
import { teamMemberById } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { formatDate } from "@/lib/utils";

export default async function SequencesPage() {
  const sequences = await listSequences();
  const stepsBySeq = new Map(
    await Promise.all(
      sequences.map(async (s) => [s.id, await listSequenceSteps(s.id)] as const),
    ),
  );
  const enrollmentsBySeq = new Map(
    await Promise.all(
      sequences.map(async (s) => [s.id, await enrollmentsForSequence(s.id)] as const),
    ),
  );

  return (
    <>
      <TopBar title="Sequences" icon={<GitBranch size={14} className="text-purple-500" />} />
      <PageHeader
        icon={<GitBranch size={14} className="text-purple-500" />}
        title="Sequences"
        count={sequences.length}
        description="Cadence templates your team uses to work contacts"
        action={<NewSequenceButton />}
      />
      <div className="page-enter flex-1 overflow-auto scrollbar-thin bg-[var(--surface)]">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10 border-b border-[var(--border)] bg-white">
            <tr className="text-left text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Steps</th>
              <th className="px-3 py-2 font-medium">Cadence (days)</th>
              <th className="px-3 py-2 font-medium">Active enrollments</th>
              <th className="px-3 py-2 font-medium">Owner</th>
              <th className="px-3 py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {sequences.map((s) => {
              const steps = stepsBySeq.get(s.id) ?? [];
              const enrollments = enrollmentsBySeq.get(s.id) ?? [];
              const active = enrollments.filter((e) => e.status === "active").length;
              const owner = teamMemberById(s.ownerId);
              return (
                <tr
                  key={s.id}
                  className="border-b border-[var(--border)] hover:bg-[var(--sidebar-hover)]"
                >
                  <td className="px-3 py-2.5">
                    <Link href={`/sequences/${s.id}`} className="font-medium hover:underline">
                      {s.name}
                    </Link>
                    {s.description && (
                      <div className="text-[11.5px] text-[var(--muted)] mt-0.5">
                        {s.description}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{steps.length}</td>
                  <td className="px-3 py-2.5 text-[var(--muted-foreground)] tabular-nums">
                    {steps.map((st) => st.dayOffset).join(", ")}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{active}</td>
                  <td className="px-3 py-2.5">
                    {owner && (
                      <div className="flex items-center gap-1.5">
                        <Avatar name={owner.name} color={owner.color} size="xs" />
                        <span className="text-[var(--muted-foreground)]">{owner.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[var(--muted-foreground)]">
                    {formatDate(s.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
