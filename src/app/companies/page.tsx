import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { PageHeader } from "@/components/PageHeader";
import { ViewToolbar } from "@/components/ViewToolbar";
import { Avatar, CompanyLogo } from "@/components/Avatar";
import { NewCompanyButton } from "@/components/NewCompanyButton";
import {
  listCompanies,
  peopleByCompany,
  dealsByCompany,
} from "@/lib/queries";
import { teamMemberById } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Building, Globe } from "lucide-react";

export default async function CompaniesPage() {
  const companies = await listCompanies();
  const companyData = new Map(
    await Promise.all(
      companies.map(async (c) => {
        const [people, deals] = await Promise.all([
          peopleByCompany(c.id),
          dealsByCompany(c.id),
        ]);
        return [c.id, { people, deals }] as const;
      }),
    ),
  );
  return (
    <>
      <TopBar title="Companies" icon={<Building size={14} className="text-blue-500" />} />
      <PageHeader
        icon={<Building size={14} className="text-blue-500" />}
        title="Companies"
        count={companies.length}
        description="Organizations in your pipeline"
        action={<NewCompanyButton />}
      />
      <ViewToolbar views={["table", "board"]} activeView="table" />
      <div className="flex-1 overflow-auto scrollbar-thin bg-white">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10 border-b border-[var(--border)] bg-white">
            <tr className="text-left text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
              <th className="w-8 px-3 py-2">
                <input type="checkbox" className="cursor-pointer" />
              </th>
              <Th>Company</Th>
              <Th>Industry</Th>
              <Th>Size</Th>
              <Th>Location</Th>
              <Th>Contacts</Th>
              <Th>Open deals</Th>
              <Th>ARR</Th>
              <Th>Owner</Th>
              <Th>Created</Th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => {
              const owner = teamMemberById(c.ownerId);
              const data = companyData.get(c.id)!;
              const peopleCount = data.people.length;
              const openDeals = data.deals.filter(
                (d) => d.stage !== "won" && d.stage !== "lost",
              );
              const openValue = openDeals.reduce((sum, d) => sum + d.value, 0);
              return (
                <tr
                  key={c.id}
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
                      href={`/companies/${c.id}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      <CompanyLogo name={c.name} domain={c.domain ?? undefined} />
                      <div className="flex flex-col">
                        <span className="font-medium">{c.name}</span>
                        {c.domain && (
                          <span className="flex items-center gap-1 text-[11px] text-[var(--muted)]">
                            <Globe size={9} />
                            {c.domain}
                          </span>
                        )}
                      </div>
                    </Link>
                  </Td>
                  <Td>
                    {c.industry && (
                      <span className="rounded-md bg-[var(--sidebar-hover)] px-1.5 py-0.5 text-[11.5px] text-[var(--muted-foreground)]">
                        {c.industry}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <span className="text-[var(--muted-foreground)]">{c.size ?? "—"}</span>
                  </Td>
                  <Td>
                    <span className="text-[var(--muted-foreground)]">{c.location ?? "—"}</span>
                  </Td>
                  <Td>
                    <span className="tabular-nums">{peopleCount}</span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums">{openDeals.length}</span>
                      {openValue > 0 && (
                        <span className="text-[11px] text-[var(--muted)]">
                          {formatCurrency(openValue)}
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td>
                    {c.arr ? (
                      <span className="tabular-nums font-medium">
                        {formatCurrency(c.arr)}
                      </span>
                    ) : (
                      <span className="text-[var(--muted)]">—</span>
                    )}
                  </Td>
                  <Td>
                    {owner && (
                      <div className="flex items-center gap-1.5">
                        <Avatar name={owner.name} color={owner.color} size="xs" />
                        <span className="text-[var(--muted-foreground)]">{owner.name}</span>
                      </div>
                    )}
                  </Td>
                  <Td>
                    <span className="text-[var(--muted-foreground)]">
                      {formatDate(c.createdAt)}
                    </span>
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
  return <th className="px-3 py-2 font-medium whitespace-nowrap">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2.5 align-middle whitespace-nowrap">{children}</td>;
}
