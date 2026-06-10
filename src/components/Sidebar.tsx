"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ChevronDown,
  Search,
  Building,
  User,
  TrendingUp,
  CheckSquare,
  GitBranch,
  Sliders,
  Users,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth-actions";
import { Avatar } from "@/components/Avatar";
import { colorFromString } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

type SidebarUser = {
  name: string;
  email: string;
  role: UserRole;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const mainNav: NavItem[] = [
  { label: "Home", href: "/", icon: <Home size={15} strokeWidth={1.75} /> },
  {
    label: "Today",
    href: "/today",
    icon: <CheckSquare size={15} strokeWidth={1.75} className="text-emerald-500" />,
  },
];

const records: NavItem[] = [
  {
    label: "Companies",
    href: "/companies",
    icon: <Building size={14} strokeWidth={1.75} className="text-blue-500" />,
  },
  {
    label: "Contacts",
    href: "/people",
    icon: <User size={14} strokeWidth={1.75} className="text-sky-500" />,
  },
  {
    label: "Pipeline",
    href: "/pipeline",
    icon: <TrendingUp size={14} strokeWidth={1.75} className="text-orange-500" />,
  },
  {
    label: "Sequences",
    href: "/sequences",
    icon: <GitBranch size={14} strokeWidth={1.75} className="text-purple-500" />,
  },
];

const settings: NavItem[] = [
  {
    label: "Scoring rules",
    href: "/scoring",
    icon: <Sliders size={14} strokeWidth={1.75} />,
  },
];

const adminSettings: NavItem[] = [
  {
    label: "Users",
    href: "/settings/users",
    icon: <Users size={14} strokeWidth={1.75} />,
  },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
        active
          ? "bg-[var(--sidebar-hover)] text-[var(--foreground)] font-medium"
          : "text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)]",
      )}
    >
      <span className="flex h-4 w-4 items-center justify-center shrink-0">{item.icon}</span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1 px-2 pt-4 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
      <ChevronDown size={11} strokeWidth={2} className="opacity-60" />
      <span>{label}</span>
    </div>
  );
}

export function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const settingsNav =
    user.role === "admin" ? [...settings, ...adminSettings] : settings;

  return (
    <aside className="flex h-screen w-[232px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)]">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent)] text-white text-[12px] font-bold">
          W
        </div>
        <div className="flex items-center gap-1 text-[13px] font-semibold">
          Wibo
          <ChevronDown size={12} className="text-[var(--muted)]" />
        </div>
      </div>

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

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-3">
        <div className="flex flex-col gap-0.5">
          {mainNav.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </div>

        <SectionHeader label="Records" />
        <div className="flex flex-col gap-0.5">
          {records.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </div>

        <SectionHeader label="Settings" />
        <div className="flex flex-col gap-0.5">
          {settingsNav.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </div>
      </nav>

      <div className="border-t border-[var(--border)] px-2 py-2">
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
          <Avatar name={user.name} color={colorFromString(user.email)} size="xs" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-medium leading-tight">
              {user.name}
            </div>
            <div className="truncate text-[11px] text-[var(--muted)] leading-tight">
              {user.role === "admin" ? "Administrator" : user.email}
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              title="Sign out"
              aria-label="Sign out"
              className="rounded p-1.5 text-[var(--muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)]"
            >
              <LogOut size={14} strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
