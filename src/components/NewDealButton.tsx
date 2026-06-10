"use client";

import { ChevronDown, Plus } from "lucide-react";
import { createDeal } from "@/lib/actions";
import { STAGES, TEAM, type Company, type Person } from "@/lib/types";
import { Field, RecordDialog, useDialogState } from "./RecordDialog";

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
      <button onClick={openDialog} className="btn-primary">
        <Plus size={12} />
        <span>{label}</span>
        <ChevronDown size={11} className="opacity-70" />
      </button>
      <RecordDialog
        open={open}
        onClose={closeDialog}
        title="New deal"
        description="Add a deal to your pipeline."
      >
        <form action={createDeal} className="grid grid-cols-2 gap-3.5">
          <div className="col-span-2">
            <Field label="Name" name="name" required>
              <input
                name="name"
                required
                placeholder="e.g. Acme — Annual contract"
                className="input"
              />
            </Field>
          </div>
          <Field label="Value" name="value">
            <input name="value" type="number" defaultValue={0} className="input" />
          </Field>
          <Field label="Currency" name="currency">
            <select name="currency" defaultValue="EUR" className="input">
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </Field>
          <Field label="Stage" name="stage">
            <select name="stage" defaultValue="lead" className="input">
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
              className="input"
            />
          </Field>
          <Field label="Company" name="companyId">
            <select
              name="companyId"
              defaultValue={defaultCompanyId ?? ""}
              className="input"
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
              className="input"
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
            <input name="expectedCloseDate" type="date" className="input" />
          </Field>
          <Field label="Owner" name="ownerId">
            <select name="ownerId" defaultValue="u1" className="input">
              {TEAM.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="col-span-2 flex justify-end gap-2 pt-1">
            <button type="button" onClick={closeDialog} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create deal
            </button>
          </div>
        </form>
      </RecordDialog>
    </>
  );
}
