"use client";

import { ChevronDown, Plus } from "lucide-react";
import { createSequence } from "@/lib/actions";
import { TEAM } from "@/lib/types";
import { Field, RecordDialog, inputClass, useDialogState } from "./RecordDialog";

export function NewSequenceButton() {
  const { open, openDialog, closeDialog } = useDialogState();
  return (
    <>
      <button onClick={openDialog} className="btn-primary">
        <Plus size={12} />
        <span>New sequence</span>
        <ChevronDown size={11} className="opacity-70" />
      </button>
      <RecordDialog open={open} onClose={closeDialog} title="New sequence">
        <form action={createSequence} className="grid grid-cols-2 gap-3.5">
          <div className="col-span-2">
            <Field label="Name" name="name" required>
              <input
                name="name"
                required
                placeholder="e.g. Cold call cadence"
                className="input"
              />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Description" name="description">
              <textarea name="description" rows={2} className="input" />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Step day offsets (comma-separated)" name="offsets">
              <input
                name="offsets"
                defaultValue="0, 2, 5, 9, 14, 20"
                className="input"
              />
            </Field>
          </div>
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
              Create sequence
            </button>
          </div>
        </form>
      </RecordDialog>
    </>
  );
}
