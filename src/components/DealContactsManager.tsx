"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import { Avatar } from "./Avatar";
import { addContactToDeal, removeContactFromDeal } from "@/lib/actions";
import type { Person } from "@/lib/types";

export function DealContactsManager({
  dealId,
  primaryContactId,
  associated,
  allPeople,
}: {
  dealId: string;
  primaryContactId: string | null;
  associated: Person[];
  allPeople: Person[];
}) {
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [, startTransition] = useTransition();

  const linkedIds = useMemo(
    () => new Set([...(primaryContactId ? [primaryContactId] : []), ...associated.map((p) => p.id)]),
    [primaryContactId, associated],
  );

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allPeople
      .filter((p) => !linkedIds.has(p.id))
      .filter((p) =>
        q
          ? `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(q)
          : true,
      )
      .slice(0, 8);
  }, [allPeople, linkedIds, query]);

  return (
    <div>
      {associated.length === 0 ? (
        <div className="px-4 py-4 text-center text-[12px] text-[var(--muted)]">
          No additional contacts. The primary contact is shown in the deal details.
        </div>
      ) : (
        <ul>
          {associated.map((p, i) => (
            <li
              key={p.id}
              className={`flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--sidebar-hover)] ${
                i !== associated.length - 1 ? "border-b border-[var(--border)]" : ""
              }`}
            >
              <Link href={`/people/${p.id}`} className="flex items-center gap-2 hover:underline">
                <Avatar name={`${p.firstName} ${p.lastName}`} />
                <span className="text-[13px] font-medium">
                  {p.firstName} {p.lastName}
                </span>
              </Link>
              {p.role && (
                <span className="text-[12px] text-[var(--muted-foreground)]">{p.role}</span>
              )}
              <button
                onClick={() =>
                  startTransition(() => {
                    removeContactFromDeal(dealId, p.id);
                  })
                }
                className="ml-auto rounded p-1 text-[var(--muted)] hover:bg-red-50 hover:text-red-600"
                aria-label="Remove contact"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-[var(--border)] p-3">
        {!adding ? (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white px-2.5 py-1.5 text-[12px] hover:bg-[var(--sidebar-hover)]"
          >
            <Plus size={12} />
            Add contact
          </button>
        ) : (
          <div className="rounded-md border border-[var(--border)] bg-white">
            <div className="flex items-center gap-1.5 border-b border-[var(--border)] px-2 py-1.5">
              <Search size={12} className="text-[var(--muted)]" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search contacts..."
                className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-[var(--muted)]"
              />
              <button
                onClick={() => {
                  setAdding(false);
                  setQuery("");
                }}
                className="rounded p-0.5 text-[var(--muted)] hover:bg-[var(--sidebar-hover)]"
              >
                <X size={12} />
              </button>
            </div>
            <ul className="max-h-64 overflow-y-auto">
              {candidates.length === 0 && (
                <li className="px-3 py-3 text-center text-[12px] text-[var(--muted)]">
                  No matching contacts
                </li>
              )}
              {candidates.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => {
                      startTransition(() => {
                        addContactToDeal(dealId, p.id);
                      });
                      setQuery("");
                      setAdding(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[var(--sidebar-hover)]"
                  >
                    <Avatar name={`${p.firstName} ${p.lastName}`} size="xs" />
                    <span>
                      {p.firstName} {p.lastName}
                    </span>
                    <span className="ml-auto text-[11px] text-[var(--muted)]">{p.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
