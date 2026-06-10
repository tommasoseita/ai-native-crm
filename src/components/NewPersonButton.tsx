"use client";

import { ChevronDown, Plus } from "lucide-react";
import { createPerson } from "@/lib/actions";
import { TEAM } from "@/lib/types";
import type { Company } from "@/lib/types";
import { Field, RecordDialog, useDialogState } from "./RecordDialog";

export function NewPersonButton({
  companies,
  defaultCompanyId,
  label = "Add contact",
}: {
  companies: Company[];
  defaultCompanyId?: string;
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
        title="New contact"
        description="Add a person to your CRM."
      >
        <form action={createPerson} className="grid grid-cols-2 gap-3.5">
          <Field label="First name" name="firstName" required>
            <input name="firstName" required className="input" />
          </Field>
          <Field label="Last name" name="lastName">
            <input name="lastName" className="input" />
          </Field>
          <div className="col-span-2">
            <Field label="Email" name="email" required>
              <input name="email" type="email" required className="input" />
            </Field>
          </div>
          <Field label="Role" name="role">
            <input name="role" placeholder="e.g. CEO" className="input" />
          </Field>
          <Field label="Phone" name="phone">
            <input name="phone" className="input" />
          </Field>
          <div className="col-span-2">
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
          </div>
          <Field label="LinkedIn" name="linkedin">
            <input name="linkedin" placeholder="linkedin.com/in/..." className="input" />
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
              Create contact
            </button>
          </div>
        </form>
      </RecordDialog>
    </>
  );
}
