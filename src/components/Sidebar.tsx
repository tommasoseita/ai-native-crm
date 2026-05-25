"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Bell,
  CheckSquare,
  FileText,
  Mail,
  Phone,
  BarChart,
  Workflow,
  Building,
  User,
  TrendingUp,
  ChevronDown,
  Search,
  Sparkles,
  MessageCircle,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
};

const mainNav: NavItem[] = [
  { label: "Home", href: "/", icon: <Home size={15} strokeWidth={1.75} /> },
  { label: "Notifications", href: "/notifications", icon: <Bell size={15} strokeWidth={1.75} /> },
  { label: "Tasks", href: "/tasks", icon: <CheckSquare size={15} strokeWidth={1.75} /> },
  { label: "Notes", href: "/notes", icon: <FileText size={15} strokeWidth={1.75} /> },
  { label: "Emails", href: "/emails", icon: <Mail size={15} strokeWidth={1.75} /> },
  { label: "Calls", href: "/calls", icon: <Phone size={15} strokeWidth={1.75} /> },
  { label: "Reports", href: "/reports", icon: <BarChart size={15} strokeWidth={1.75} /> },
];

const records: NavItem[] = [
  {
    label: "Companies",
    href: "/companies",
    icon: <Building size={14} strokeWidth={1.75} className="text-blue-500" />,
  },
  {
    label: "People",
    href: "/people",
    icon: <User size={14} strokeWidth={1.75} className="text-sky-500" />,
  },
  {
    label: "Pipeline",
    href: "/pipeline",
    icon: <TrendingUp size={14} strokeWidth={1.75} className="text-orange-500" />,
  },
];

function NavLink({
  item,
  active,
  indent,
}: {
  item: NavItem;
  active: boolean;
  indent?: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
        indent && "pl-3",
        active
          ? "bg-[var(--sidebar-hover)] text-[var(--foreground)] font-medium"
          : "text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)]",
      )}
    >
      <span className="flex h-4 w-4 items-center justify-center shrink-0">{item.icon}</span>
      <span className="truncate">{item.label}</span>
      {item.badge && (
        <span className="ml-auto text-[10px] text-[var(--muted)]">{item.badge}</span>
      )}
    </Link>
  );
}

function SectionHeader({
  label,
  action,
}: {
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1 px-2 pt-4 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
      <ChevronDown size={11} strokeWidth={2} className="opacity-60" />
      <span>{label}</span>
      {action && <span className="ml-auto">{action}</span>}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="flex h-screen w-[232px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)]">
      {/* Workspace switcher */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent)] text-white text-[12px] font-bold">
          W
        </div>
        <div className="flex items-center gap-1 text-[13px] font-semibold">
          Wibo
          <ChevronDown size={12} className="text-[var(--muted)]" />
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <button className="group flex w-full items-center gap-2 rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-left text-[12px] text-[var(--muted)] hover:border-[var(--muted)]">
          <Search size={13} />
          <span>Quick search</span>
          <span className="ml-auto flex items-center gap-0.5">
            <span className="kbd">⌘</span>
            <span className="kbd">K</span>
          </span>
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-3">
        <div className="flex flex-col gap-0.5">
          {mainNav.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}

          <div className="mt-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)] cursor-pointer">
            <span className="flex h-4 w-4 items-center justify-center">
              <Workflow size={14} strokeWidth={1.75} />
            </span>
            <span>Automations</span>
            <ChevronDown size={12} className="ml-auto text-[var(--muted)]" />
          </div>
        </div>

        <SectionHeader
          label="Records"
          action={
            <button
              className="rounded p-0.5 hover:bg-[var(--sidebar-hover)]"
              aria-label="Add record type"
            >
              <Plus size={11} />
            </button>
          }
        />
        <div className="flex flex-col gap-0.5">
          {records.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </div>

        <SectionHeader label="Lists" />
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)] cursor-pointer">
            <span className="flex h-4 w-4 items-center justify-center text-amber-500">★</span>
            <span>High intent</span>
          </div>
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)] cursor-pointer">
            <span className="flex h-4 w-4 items-center justify-center text-purple-500">◆</span>
            <span>Q2 closing</span>
          </div>
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)] cursor-pointer">
            <span className="flex h-4 w-4 items-center justify-center text-slate-400">▦</span>
            <span>Cold outreach</span>
          </div>
        </div>

        <SectionHeader label="Chats" />
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)] cursor-pointer">
            <Sparkles size={13} className="text-[var(--accent)]" />
            <span className="truncate">Show me deals closing this month</span>
          </div>
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)] cursor-pointer">
            <MessageCircle size={13} className="text-[var(--muted)]" />
            <span className="truncate">Cold leads I should re-engage</span>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--border)] p-3">
        <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)]">
          <User size={13} />
          <span>Invite team members</span>
        </button>
        <div className="mt-2 flex items-center justify-between rounded-md bg-[var(--accent-soft)] px-2 py-1.5 text-[11px]">
          <span className="text-[var(--accent)]">13 days left in trial</span>
          <button className="rounded bg-[var(--accent)] px-2 py-0.5 text-[10px] font-medium text-white">
            Keep Pro
          </button>
        </div>
      </div>
    </aside>
  );
}
