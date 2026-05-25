import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { PageHeader } from "@/components/PageHeader";
import { ViewToolbar } from "@/components/ViewToolbar";
import { Avatar, CompanyLogo } from "@/components/Avatar";
import { NewPersonButton } from "@/components/NewPersonButton";
import { listPeople, listCompanies, getCompany } from "@/lib/queries";
import { teamMemberById } from "@/lib/types";
import { relativeTime } from "@/lib/utils";
import { User, Mail } from "lucide-react";

const TODAY = new Date("2026-05-25");

export default function PeoplePage() {
  const people = listPeople();
  const companies = listCompanies();

  return (
    <>
      <TopBar title="Contacts" icon={<User size={14} className="text-sky-500" />} />
      <PageHeader
        icon={<User size={14} className="text-sky-500" />}
        title="Contacts"
        count={people.length}
        description="All contacts across your workspace"
        action={<NewPersonButton companies={companies} />}
      />
      <ViewToolbar views={["table", "board"]} activeView="table" />
      <div className="flex-1 overflow-auto scrollbar-thin bg-white">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10 border-b border-[var(--border)] bg-white">
            <tr className="text-left text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
              <th className="w-8 px-3 py-2">
                <input type="checkbox" className="cursor-pointer" />
              </th>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Company</Th>
              <Th>Email</Th>
              <Th>Last contacted</Th>
              <Th>Owner</Th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => {
              const company = p.companyId ? getCompany(p.companyId) : undefined;
              const owner = teamMemberById(p.ownerId);
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
                        <CompanyLogo name={company.name} domain={company.domain ?? undefined} size="xs" />
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
                      {relativeTime(p.lastContactedAt ?? undefined, TODAY)}
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
