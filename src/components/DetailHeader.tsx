import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function DetailHeader({
  backHref,
  backLabel,
  title,
  subtitle,
  icon,
  actions,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--border)] bg-white px-6 pt-4 pb-4">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-[12px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      >
        <ChevronLeft size={12} />
        {backLabel}
      </Link>
      <div className="mt-2 flex items-start gap-3">
        {icon && <div className="mt-0.5">{icon}</div>}
        <div className="min-w-0 flex-1">
          <h1 className="text-[20px] font-semibold tracking-tight truncate">{title}</h1>
          {subtitle && (
            <div className="mt-0.5 text-[12.5px] text-[var(--muted-foreground)]">
              {subtitle}
            </div>
          )}
        </div>
        {actions && <div className="flex items-center gap-1.5">{actions}</div>}
      </div>
    </div>
  );
}

export function PropList({ children }: { children: React.ReactNode }) {
  return (
    <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-[13px]">
      {children}
    </dl>
  );
}

export function Prop({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-[12px] text-[var(--muted)] py-1">{label}</dt>
      <dd className="py-1">{children}</dd>
    </>
  );
}

export function Panel({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-white">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
        <h2 className="text-[13px] font-medium">{title}</h2>
        {typeof count === "number" && (
          <span className="rounded-full bg-[var(--sidebar-hover)] px-1.5 py-0.5 text-[11px] text-[var(--muted-foreground)]">
            {count}
          </span>
        )}
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div>{children}</div>
    </section>
  );
}

export function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-6 text-center text-[12px] text-[var(--muted)]">{children}</div>
  );
}
