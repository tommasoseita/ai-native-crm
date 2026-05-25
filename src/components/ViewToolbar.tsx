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
    <div className="flex items-center gap-1 border-b border-[var(--border)] bg-white px-6 py-1.5 text-[12px]">
      {views.map((v) => {
        const meta = VIEW_META[v];
        const Icon = meta.Icon;
        const active = v === activeView;
        return (
          <button
            key={v}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 ${
              active
                ? "bg-[var(--sidebar-hover)] text-[var(--foreground)] font-medium"
                : "text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)]"
            }`}
          >
            <Icon size={12} />
            <span>{meta.label}</span>
          </button>
        );
      })}
      <div className="ml-auto flex items-center gap-1">
        <div className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)]">
          <Search size={12} />
          <input
            value={search ?? ""}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder="Search..."
            className="w-40 bg-transparent text-[12px] outline-none placeholder:text-[var(--muted)]"
          />
        </div>
        <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)]">
          <SlidersHorizontal size={12} />
          <span>Filter</span>
        </button>
        <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)]">
          <ArrowUpDown size={12} />
          <span>Sort</span>
        </button>
      </div>
    </div>
  );
}
