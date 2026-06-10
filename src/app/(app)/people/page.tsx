import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { PageHeader } from "@/components/PageHeader";
import { ViewToolbar } from "@/components/ViewToolbar";
import { Avatar, CompanyLogo } from "@/components/Avatar";
import { NewPersonButton } from "@/components/NewPersonButton";
import { ScoreBadge } from "@/components/ScoreBadge";
import { CallButton } from "@/components/CallButton";
import { listPeople, listCompanies, getScoringConfig } from "@/lib/queries";
import { scoreMany } from "@/lib/scoring";
import { teamMemberById } from "@/lib/types";
import { relativeTime, today } from "@/lib/utils";
import { User, Mail } from "lucide-react";

export default async function PeoplePage() {
  const [people, companies, config] = await Promise.all([
    listPeople(),
    listCompanies(),
    getScoringConfig(),
  ]);
  const companyMap = new Map(companies.map((c) => [c.id, c]));
  const scores = scoreMany(people, companyMap, config, today());

  const sorted = [...people].sort((a, b) => {
    const sa = scores.get(a.id)?.score ?? 0;
    const sb = scores.get(b.id)?.score ?? 0;
    return sb - sa;
  });

  return (
    <>
      <TopBar title="Contacts" icon={<User size={14} className="text-sky-500" />} />
      <PageHeader
        icon={<User size={14} className="text-sky-500" />}
        title="Contacts"
        count={people.length}
        description="All contacts across your workspace, sorted by lead score"
        action={<NewPersonButton companies={companies} />}
      />
      <ViewToolbar views={["table", "board"]} activeView="table" />
      <div className="page-enter flex-1 overflow-auto scrollbar-thin bg-[var(--surface)]">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10 border-b border-[var(--border)] bg-white">
            <tr className="text-left text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
              <th className="w-8 px-3 py-2">
                <input type="checkbox" className="cursor-pointer" />
              </th>
              <Th>Tier</Th>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Company</Th>
              <Th>Email</Th>
              <Th>Last contacted</Th>
              <Th>Owner</Th>
              <th className="px-3 py-2 w-10">
                <span className="sr-only">Call</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const company = p.companyId ? companyMap.get(p.companyId) : undefined;
              const owner = teamMemberById(p.ownerId);
              const score = scores.get(p.id);
              return (
                <tr
                  key={p.id}
                  className="group border-b border-[var(--border)] hover:bg-[var(--sidebar-hover)]"
                >
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      className="cursor-pointer opacity-0 group-hover:opacity-100"
                    />
                  </td>
                  <Td>{score && <ScoreBadge score={score} />}</Td>
                  <Td>
                    <Link
                      href={`/people/${p.id}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      <Avatar name={`${p.firstName} ${p.lastName}`} />
                      <span className="font-medium">
                        {p.firstName} {p.lastName}
                      </span>
                    </Link>
                  </Td>
                  <Td>
                    <span className="text-[var(--muted-foreground)]">{p.role ?? "—"}</span>
                  </Td>
                  <Td>
                    {company ? (
                      <Link
                        href={`/companies/${company.id}`}
                        className="flex items-center gap-2 hover:underline"
                      >
                        <CompanyLogo
                          name={company.name}
                          domain={company.domain ?? undefined}
                          size="xs"
                        />
                        <span>{company.name}</span>
                      </Link>
                    ) : (
                      <span className="text-[var(--muted)]">—</span>
                    )}
                  </Td>
                  <Td>
                    <a
                      href={`mailto:${p.email}`}
                      className="inline-flex items-center gap-1 text-[var(--muted-foreground)] hover:text-[var(--accent)]"
                    >
                      <Mail size={11} />
                      {p.email}
                    </a>
                  </Td>
                  <Td>
                    <span className="text-[var(--muted-foreground)]">
                      {relativeTime(p.lastContactedAt ?? undefined, today())}
                    </span>
                  </Td>
                  <Td>
                    {owner && (
                      <div className="flex items-center gap-1.5">
                        <Avatar name={owner.name} color={owner.color} size="xs" />
                        <span className="text-[var(--muted-foreground)]">{owner.name}</span>
                      </div>
                    )}
                  </Td>
                  <td className="px-3 py-2.5 text-right">
                    {p.phone && (
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <CallButton
                          phone={p.phone}
                          contact={{
                            name: `${p.firstName} ${p.lastName}`,
                            company: company?.name,
                            href: `/people/${p.id}`,
                          }}
                          variant="icon"
                        />
                      </span>
                    )}
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

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 font-medium">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2.5 align-middle">{children}</td>;
}
