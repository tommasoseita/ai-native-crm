"use client";

import { ChevronDown, Plus } from "lucide-react";
import { createSequence } from "@/lib/actions";
import { TEAM } from "@/lib/types";
import { Field, RecordDialog, inputClass, useDialogState } from "./RecordDialog";

export function NewSequenceButton() {
  const { open, openDialog, closeDialog } = useDialogState();
  return (
    <>
      <button
        onClick={openDialog}
        className="flex items-center gap-1 rounded-md bg-[var(--foreground)] px-2.5 py-1.5 text-[12px] font-medium text-white hover:bg-black"
      >
        <Plus size={12} />
        <span>New sequence</span>
        <ChevronDown size={11} className="opacity-70" />
      </button>
      <RecordDialog open={open} onClose={closeDialog} title="New sequence">
        <form action={createSequence} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field label="Name" name="name" required>
              <input
                name="name"
                required
                placeholder="e.g. Cold call cadence"
                className={inputClass}
              />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Description" name="description">
              <textarea name="description" rows={2} className={inputClass} />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Step day offsets (comma-separated)" name="offsets">
              <input
                name="offsets"
                defaultValue="0, 2, 5, 9, 14, 20"
                className={inputClass}
              />
            </Field>
          </div>
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
              Create sequence
            </button>
          </div>
        </form>
      </RecordDialog>
    </>
  );
}
