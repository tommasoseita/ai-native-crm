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
    <div
      className="px-6 pt-6 pb-5"
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div
            className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--accent)]"
            style={{
              background: "var(--accent-soft)",
              boxShadow: "inset 0 0 0 1px var(--accent-ring)",
            }}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-[19px] font-semibold tracking-tight text-[var(--foreground)]">
              {title}
            </h1>
            {typeof count === "number" && (
              <span
                className="pill"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {count}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-secondary">
            <Sparkles size={12} className="text-[var(--accent)]" />
            <span>Ask AI</span>
          </button>
          {action}
        </div>
      </div>
    </div>
  );
}
