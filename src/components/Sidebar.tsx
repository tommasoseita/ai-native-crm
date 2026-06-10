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

// Scoped styles for the sidebar. Lives in a single <style> tag rather than
// in globals.css so the file is self-contained. Selectors are namespaced
// under [data-sidebar] to avoid collisions.
const SIDEBAR_CSS = `
[data-sidebar] .sb-nav-link {
  position: relative;
  color: var(--muted-foreground);
  transition:
    background-color var(--dur-fast) var(--ease),
    color var(--dur-fast) var(--ease);
}
[data-sidebar] .sb-nav-link::before {
  content: "";
  position: absolute;
  left: -6px;
  top: 6px;
  bottom: 6px;
  width: 2.5px;
  border-radius: 2px;
  background: var(--accent);
  opacity: 0;
  transform: scaleY(0.4);
  transition:
    opacity var(--dur) var(--ease-out),
    transform var(--dur) var(--ease-spring);
}
[data-sidebar] .sb-nav-link:hover {
  background: var(--sidebar-hover);
  color: var(--foreground);
}
[data-sidebar] .sb-nav-link[aria-current="page"] {
  background: var(--sidebar-active);
  color: var(--foreground);
  font-weight: 500;
}
[data-sidebar] .sb-nav-link[aria-current="page"]::before {
  opacity: 1;
  transform: scaleY(1);
}
[data-sidebar] .sb-nav-link[aria-current="page"] .sb-nav-icon > svg {
  color: var(--accent);
}

[data-sidebar] .sb-brand .sb-brand-chevron {
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease);
}
[data-sidebar] .sb-brand:hover .sb-brand-chevron {
  opacity: 1;
}

[data-sidebar] .sb-search {
  background: var(--surface);
  border: 1px solid var(--border);
  transition:
    border-color var(--dur-fast) var(--ease),
    box-shadow var(--dur-fast) var(--ease);
}
[data-sidebar] .sb-search:hover {
  border-color: var(--border-strong);
}
[data-sidebar] .sb-search:focus-visible {
  outline: none;
  border-color: var(--accent);
  box-shadow: var(--shadow-focus);
}

[data-sidebar] .sb-logout {
  color: var(--muted);
  opacity: 0;
  transition:
    opacity var(--dur) var(--ease),
    background-color var(--dur-fast) var(--ease),
    color var(--dur-fast) var(--ease);
}
[data-sidebar] .sb-user-row:hover .sb-logout,
[data-sidebar] .sb-logout:focus-visible {
  opacity: 1;
}
[data-sidebar] .sb-logout:hover {
  background: var(--sidebar-hover);
  color: var(--foreground);
}
`;

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className="sb-nav-link flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]"
    >
      <span className="sb-nav-icon flex h-4 w-4 items-center justify-center shrink-0">
        {item.icon}
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-2 pt-5 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
      {label}
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
    <aside
      data-sidebar
      className="flex h-screen w-[232px] shrink-0 flex-col"
      style={{
        background: "var(--sidebar)",
        boxShadow: "inset -1px 0 0 var(--border)",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: SIDEBAR_CSS }} />

      {/* Brand */}
      <div className="sb-brand flex items-center gap-2 px-3 pt-3.5 pb-2.5">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-md text-white text-[12px] font-bold"
          style={{
            background:
              "linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)",
            boxShadow:
              "var(--shadow-sm), inset 0 1px 0 rgba(255,255,255,0.22)",
          }}
        >
          W
        </div>
        <div className="flex items-center gap-1 text-[13.5px] font-semibold tracking-tight">
          <span>Wibo</span>
          <ChevronDown
            size={12}
            className="sb-brand-chevron text-[var(--muted)]"
          />
        </div>
      </div>

      {/* Quick search */}
      <div className="px-3 pb-2">
        <button
          type="button"
          className="sb-search flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px]"
        >
          <Search size={13} className="text-[var(--muted)]" />
          <span className="text-[var(--muted)]">Quick search</span>
          <span className="ml-auto flex items-center gap-0.5">
            <span className="kbd">⌘</span>
            <span className="kbd">K</span>
          </span>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-3">
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

      {/* User footer */}
      <div
        className="px-2 py-2"
        style={{ boxShadow: "inset 0 1px 0 var(--border)" }}
      >
        <div className="sb-user-row flex items-center gap-2 rounded-md px-2 py-1.5">
          <div
            className="shrink-0 rounded-full"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <Avatar
              name={user.name}
              color={colorFromString(user.email)}
              size="xs"
            />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[12.5px] font-medium text-[var(--foreground)]">
              {user.name}
            </div>
            <div className="truncate text-[11px] text-[var(--muted)]">
              {user.role === "admin" ? "Administrator" : user.email}
            </div>
          </div>
          <form action={logout} className="shrink-0">
            <button
              type="submit"
              title="Sign out"
              aria-label="Sign out"
              className="sb-logout flex h-7 w-7 items-center justify-center rounded-md"
            >
              <LogOut size={13} strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
