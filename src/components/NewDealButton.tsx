"use client";

import { ChevronDown, Plus } from "lucide-react";
import { createDeal } from "@/lib/actions";
import { STAGES, TEAM, type Company, type Person } from "@/lib/types";
import { Field, RecordDialog, inputClass, useDialogState } from "./RecordDialog";

export function NewDealButton({
  companies,
  people,
  defaultCompanyId,
  defaultContactId,
  label = "Add deal",
}: {
  companies: Company[];
  people: Person[];
  defaultCompanyId?: string;
  defaultContactId?: string;
  label?: string;
}) {
  const { open, openDialog, closeDialog } = useDialogState();
  return (
    <>
      <button
        onClick={openDialog}
        className="flex items-center gap-1 rounded-md bg-[var(--foreground)] px-2.5 py-1.5 text-[12px] font-medium text-white hover:bg-black"
      >
        <Plus size={12} />
        <span>{label}</span>
        <ChevronDown size={11} className="opacity-70" />
      </button>
      <RecordDialog open={open} onClose={closeDialog} title="New deal">
        <form action={createDeal} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label="Name" name="name" required>
              <input
                name="name"
                required
                placeholder="e.g. Acme — Annual contract"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Value" name="value">
            <input name="value" type="number" defaultValue={0} className={inputClass} />
          </Field>
          <Field label="Currency" name="currency">
            <select name="currency" defaultValue="EUR" className={inputClass}>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </Field>
          <Field label="Stage" name="stage">
            <select name="stage" defaultValue="lead" className={inputClass}>
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Probability (%)" name="probability">
            <input
              name="probability"
              type="number"
              min={0}
              max={100}
              defaultValue={20}
              className={inputClass}
            />
          </Field>
          <Field label="Company" name="companyId">
            <select
              name="companyId"
              defaultValue={defaultCompanyId ?? ""}
              className={inputClass}
            >
              <option value="">No company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Primary contact" name="primaryContactId">
            <select
              name="primaryContactId"
              defaultValue={defaultContactId ?? ""}
              className={inputClass}
            >
              <option value="">No contact</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Expected close" name="expectedCloseDate">
            <input name="expectedCloseDate" type="date" className={inputClass} />
          </Field>
          <Field label="Owner" name="ownerId">
            <select name="ownerId" defaultValue="u1" className={inputClass}>
              {TEAM.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-md border border-[var(--border)] px-3 py-1.5 text-[12px] hover:bg-[var(--sidebar-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-[var(--foreground)] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-black"
            >
              Create deal
            </button>
          </div>
        </form>
      </RecordDialog>
    </>
  );
}
