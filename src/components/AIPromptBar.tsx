"use client";

import { useState } from "react";
import { ArrowUp, Slash } from "lucide-react";

const SUGGESTIONS = [
  "How many contacts should I enroll today?",
  "Who should I call first?",
  "Which contacts haven't replied after 4 touches?",
  "Forecast my pipeline if every open deal closes at 70%",
];

export function AIPromptBar() {
  const [value, setValue] = useState("");

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-xl border border-[var(--border)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus-within:border-[var(--accent)]/40 focus-within:shadow-[0_0_0_3px_rgba(91,95,239,0.08)]">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask anything..."
          rows={3}
          className="w-full resize-none rounded-xl bg-transparent px-4 pt-3 text-[14px] outline-none placeholder:text-[var(--muted)]"
        />
        <div className="flex items-center justify-between px-3 pb-2.5">
          <button className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)]">
            Auto
          </button>
          <div className="flex items-center gap-1">
            <button
              className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)]"
              aria-label="Commands"
            >
              <Slash size={13} />
            </button>
            <button
              className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors"
              aria-label="Send"
            >
              <ArrowUp size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setValue(s)}
            className="rounded-full border border-[var(--border)] bg-white px-2.5 py-1 text-[11.5px] text-[var(--muted-foreground)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
