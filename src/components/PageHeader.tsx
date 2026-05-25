import { Sparkles } from "lucide-react";

export function PageHeader({
  icon,
  title,
  count,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  count?: number;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--border)] bg-white px-6 pt-5 pb-3">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-soft)]">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-semibold tracking-tight">{title}</h1>
            {typeof count === "number" && (
              <span className="rounded-full bg-[var(--sidebar-hover)] px-1.5 py-0.5 text-[11px] text-[var(--muted-foreground)]">
                {count}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-0.5 text-[12.5px] text-[var(--muted-foreground)]">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button className="flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white px-2.5 py-1.5 text-[12px] text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)]">
            <Sparkles size={12} className="text-[var(--accent)]" />
            <span>Ask AI</span>
          </button>
          {action}
        </div>
      </div>
    </div>
  );
}
