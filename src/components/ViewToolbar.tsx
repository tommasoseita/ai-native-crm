"use client";

import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  LayoutGrid,
  Table2,
} from "lucide-react";

export type ViewKind = "table" | "board";

const VIEW_META: Record<ViewKind, { label: string; Icon: typeof Table2 }> = {
  table: { label: "Table", Icon: Table2 },
  board: { label: "Board", Icon: LayoutGrid },
};

export function ViewToolbar({
  views,
  activeView,
  search,
  onSearch,
}: {
  views: ViewKind[];
  activeView: ViewKind;
  search?: string;
  onSearch?: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 border-b border-[var(--border)] bg-[var(--surface)] px-6 py-2 text-[12px]">
      <div
        className="relative flex items-center gap-0.5 rounded-md p-0.5"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        {views.map((v) => {
          const meta = VIEW_META[v];
          const Icon = meta.Icon;
          const active = v === activeView;
          return (
            <button
              key={v}
              aria-pressed={active}
              className="relative flex items-center gap-1.5 rounded px-2 py-1 transition-colors"
              style={{
                background: active ? "var(--surface)" : "transparent",
                color: active ? "var(--foreground)" : "var(--muted-foreground)",
                fontWeight: active ? 500 : 400,
                boxShadow: active ? "var(--shadow-xs)" : undefined,
                transition:
                  "background-color var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease), box-shadow var(--dur-fast) var(--ease)",
              }}
            >
              <Icon size={12} />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>
      <div className="ml-auto flex items-center gap-1">
        <div
          className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors"
          style={{
            border: "1px solid transparent",
            color: "var(--muted-foreground)",
          }}
        >
          <Search size={12} />
          <input
            value={search ?? ""}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder="Search..."
            className="w-40 bg-transparent text-[12px] outline-none placeholder:text-[var(--muted)]"
          />
        </div>
        <button className="btn-ghost" style={{ height: 26 }}>
          <SlidersHorizontal size={12} />
          <span>Filter</span>
        </button>
        <button className="btn-ghost" style={{ height: 26 }}>
          <ArrowUpDown size={12} />
          <span>Sort</span>
        </button>
      </div>
    </div>
  );
}
