"use client";

import { Trash2 } from "lucide-react";

export function DeleteRecordButton({
  action,
  label = "Delete",
}: {
  action: () => Promise<void>;
  label?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this record? This cannot be undone.")) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white px-2.5 py-1.5 text-[12px] text-[var(--muted-foreground)] hover:border-red-300 hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 size={12} />
        <span>{label}</span>
      </button>
    </form>
  );
}
