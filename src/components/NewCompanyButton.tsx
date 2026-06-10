"use client";

import { ChevronDown, Plus } from "lucide-react";
import { createCompany } from "@/lib/actions";
import { TEAM } from "@/lib/types";
import { Field, RecordDialog, useDialogState } from "./RecordDialog";

const SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

export function NewCompanyButton() {
  const { open, openDialog, closeDialog } = useDialogState();
  return (
    <>
      <button onClick={openDialog} className="btn-primary">
        <Plus size={12} />
        <span>Add company</span>
        <ChevronDown size={11} className="opacity-70" />
      </button>
      <RecordDialog
        open={open}
        onClose={closeDialog}
        title="New company"
        description="Add a company to your CRM."
      >
        <form action={createCompany} className="grid grid-cols-2 gap-3.5">
          <div className="col-span-2">
            <Field label="Name" name="name" required>
              <input name="name" required className="input" />
            </Field>
          </div>
          <Field label="Domain" name="domain">
            <input name="domain" placeholder="acme.com" className="input" />
          </Field>
          <Field label="Industry" name="industry">
            <input name="industry" className="input" />
          </Field>
          <Field label="Size" name="size">
            <select name="size" className="input" defaultValue="">
              <option value="" disabled>
                Select size
              </option>
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Location" name="location">
            <input name="location" className="input" />
          </Field>
          <Field label="ARR (€)" name="arr">
            <input name="arr" type="number" className="input" />
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
          <div className="col-span-2">
            <Field label="Description" name="description">
              <textarea name="description" rows={2} className="input" />
            </Field>
          </div>
          <div className="col-span-2 flex justify-end gap-2 pt-1">
            <button type="button" onClick={closeDialog} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create company
            </button>
          </div>
        </form>
      </RecordDialog>
    </>
  );
}
