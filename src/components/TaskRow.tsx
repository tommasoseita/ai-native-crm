"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Phone, ChevronDown, SkipForward, Check } from "lucide-react";
import { Avatar, CompanyLogo } from "./Avatar";
import { completeTask, skipTask } from "@/lib/actions";
import {
  OUTCOME_LABELS,
  type Company,
  type Person,
  type Task,
  type TaskOutcome,
} from "@/lib/types";

const OUTCOMES: TaskOutcome[] = [
  "no_answer",
  "voicemail",
  "connected",
  "replied",
  "booked",
  "disqualified",
  "bad_number",
];

export function TaskRow({
  task,
  person,
  company,
  variant = "today",
}: {
  task: Task;
  person: Person;
  company: Company | undefined;
  variant?: "today" | "overdue";
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-2.5 ${
        variant === "overdue" ? "bg-red-50/40" : ""
      } hover:bg-[var(--sidebar-hover)]`}
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)]">
        <Phone size={13} />
      </div>
      <Link
        href={`/people/${person.id}`}
        className="flex items-center gap-2 hover:underline"
      >
        <Avatar name={`${person.firstName} ${person.lastName}`} />
        <span className="text-[13px] font-medium">
          {person.firstName} {person.lastName}
        </span>
      </Link>
      <span className="text-[11.5px] text-[var(--muted)]">Step {task.stepNumber}</span>
      {company && (
        <Link
          href={`/companies/${company.id}`}
          className="flex items-center gap-1.5 text-[12px] text-[var(--muted-foreground)] hover:underline"
        >
          <CompanyLogo name={company.name} domain={company.domain ?? undefined} size="xs" />
          <span>{company.name}</span>
        </Link>
      )}
      {person.role && (
        <span className="text-[11.5px] text-[var(--muted)] truncate max-w-[140px]">
          {person.role}
        </span>
      )}
      <div className="ml-auto flex items-center gap-1.5">
        <span className="text-[11px] text-[var(--muted)] tabular-nums">
          {variant === "overdue" ? "due " : ""}
          {task.dueDate}
        </span>
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            disabled={pending}
            className="flex items-center gap-1 rounded-md bg-[var(--foreground)] px-2 py-1 text-[11.5px] font-medium text-white hover:bg-black disabled:opacity-50"
          >
            <Check size={11} />
            <span>Complete</span>
            <ChevronDown size={10} className="opacity-70" />
          </button>
          {open && (
            <div className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-lg">
              {OUTCOMES.map((o) => (
                <button
                  key={o}
                  onClick={() => {
                    setOpen(false);
                    startTransition(() => {
                      completeTask(task.id, o);
                    });
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px] hover:bg-[var(--sidebar-hover)]"
                >
                  {OUTCOME_LABELS[o]}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() =>
            startTransition(() => {
              skipTask(task.id);
            })
          }
          disabled={pending}
          className="flex items-center gap-1 rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[11.5px] text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)] disabled:opacity-50"
        >
          <SkipForward size={11} />
          <span>Skip</span>
        </button>
      </div>
    </div>
  );
}
