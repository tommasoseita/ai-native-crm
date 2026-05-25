import { TopBar } from "@/components/TopBar";
import { PageHeader } from "@/components/PageHeader";
import { ViewToolbar } from "@/components/ViewToolbar";
import { Avatar, CompanyLogo } from "@/components/Avatar";
import {
  companies,
  peopleByCompany,
  dealsByCompany,
  teamMemberById,
} from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Building, Globe, MoreHorizontal } from "lucide-react";

export default function CompaniesPage() {
  return (
    <>
      <TopBar title="Companies" icon={<Building size={14} className="text-blue-500" />} />
      <PageHeader
        icon={<Building size={14} className="text-blue-500" />}
        title="Companies"
        count={companies.length}
        description="Organizations in your pipeline"
        primaryAction="Add company"
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
              <Th>People</Th>
              <Th>Open deals</Th>
              <Th>ARR</Th>
              <Th>Owner</Th>
              <Th>Created</Th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => {
              const owner = teamMemberById(c.ownerId);
              const peopleCount = peopleByCompany(c.id).length;
              const openDeals = dealsByCompany(c.id).filter(
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
                    <div className="flex items-center gap-2">
                      <CompanyLogo name={c.name} domain={c.domain} />
                      <div className="flex flex-col">
                        <span className="font-medium">{c.name}</span>
                        <span className="flex items-center gap-1 text-[11px] text-[var(--muted)]">
                          <Globe size={9} />
                          {c.domain}
                        </span>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span className="rounded-md bg-[var(--sidebar-hover)] px-1.5 py-0.5 text-[11.5px] text-[var(--muted-foreground)]">
                      {c.industry}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-[var(--muted-foreground)]">{c.size}</span>
                  </Td>
                  <Td>
                    <span className="text-[var(--muted-foreground)]">{c.location}</span>
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
                  <td className="px-2">
                    <button className="rounded p-1 opacity-0 hover:bg-white group-hover:opacity-100">
                      <MoreHorizontal size={13} className="text-[var(--muted)]" />
                    </button>
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
  return <th className="px-3 py-2 font-medium whitespace-nowrap">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2.5 align-middle whitespace-nowrap">{children}</td>;
}
