"use client";

import { ChevronDown, Plus } from "lucide-react";
import { createCompany } from "@/lib/actions";
import { TEAM } from "@/lib/types";
import { Field, RecordDialog, inputClass, useDialogState } from "./RecordDialog";

const SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

export function NewCompanyButton() {
  const { open, openDialog, closeDialog } = useDialogState();
  return (
    <>
      <button
        onClick={openDialog}
        className="flex items-center gap-1 rounded-md bg-[var(--foreground)] px-2.5 py-1.5 text-[12px] font-medium text-white hover:bg-black"
      >
        <Plus size={12} />
        <span>Add company</span>
        <ChevronDown size={11} className="opacity-70" />
      </button>
      <RecordDialog open={open} onClose={closeDialog} title="New company">
        <form action={createCompany} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label="Name" name="name" required>
              <input name="name" required className={inputClass} />
            </Field>
          </div>
          <Field label="Domain" name="domain">
            <input name="domain" placeholder="acme.com" className={inputClass} />
          </Field>
          <Field label="Industry" name="industry">
            <input name="industry" className={inputClass} />
          </Field>
          <Field label="Size" name="size">
            <select name="size" className={inputClass} defaultValue="">
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
            <input name="location" className={inputClass} />
          </Field>
          <Field label="ARR (€)" name="arr">
            <input name="arr" type="number" className={inputClass} />
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
          <div className="col-span-2">
            <Field label="Description" name="description">
              <textarea name="description" rows={2} className={inputClass} />
            </Field>
          </div>
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
              Create company
            </button>
          </div>
        </form>
      </RecordDialog>
    </>
  );
}
