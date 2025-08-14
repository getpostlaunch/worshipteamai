"use client";

import { useEffect, useMemo, useRef, useState, type ElementType, type RefObject } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Library,
  ListMusic,
  Users,
  CreditCard,
  Building2,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { supabase } from "@/utils/supabaseClient";

type NavChild = { label: string; href: string };
type NavLink = { label: string; icon: ElementType; href: string };
type NavSection = { id: "churches" | "account"; label: string; icon: ElementType; children: NavChild[] };
type NavItem = NavLink | NavSection;

type Props = {
  orgSlug: string | null;
  orgName?: string | null;
  userEmail?: string | null;
  /** Mobile drawer state */
  open?: boolean;
  onClose?: () => void;
  /** Pass the hamburger button ref so we can restore focus on close */
  returnFocusRef?: RefObject<HTMLElement>;
};

const LS = {
  expanded: "sidebar:expanded",
  openChurches: "sidebar:open:churches",
  openAccount: "sidebar:open:account",
} as const;

function usePersistedBool(key: string, initial: boolean) {
  const [val, setVal] = useState<boolean>(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === "0" || raw === "1") setVal(raw === "1");
    } catch {}
  }, [key]);
  useEffect(() => {
    try {
      localStorage.setItem(key, val ? "1" : "0");
    } catch {}
  }, [key, val]);
  return [val, setVal] as const;
}

export default function AdminSidebar({
  orgSlug,
  orgName,
  userEmail,
  open = false,
  onClose,
  returnFocusRef,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  // Build base once from slug
  const base = orgSlug ? `/app/orgs/${orgSlug}` : `/app`;

  // expanded rail (desktop)
  const [expanded, setExpanded] = useState<boolean>(true);
  useEffect(() => {
    const saved = localStorage.getItem(LS.expanded);
    if (saved) setExpanded(saved === "1");
  }, []);
  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      localStorage.setItem(LS.expanded, next ? "1" : "0");
      return next;
    });
  };

  // per-section open state
  const [openChurches, setOpenChurches] = usePersistedBool(LS.openChurches, true);
  const [openAccount, setOpenAccount] = usePersistedBool(LS.openAccount, true);

  // Nav (slug-based when available)
  const nav: NavItem[] = useMemo(
    () => [
      { label: "Dashboard", icon: Home, href: base }, // org dashboard or /app
      {
        id: "churches",
        label: "Churches",
        icon: Building2,
        children: [
          { label: "Manage", href: "/app/orgs" },
          { label: "Add New", href: "/app/orgs/new" },
        ],
      },
      ...(orgSlug
        ? [
            { label: "Songs", icon: Library, href: `${base}/songs` },
            { label: "Setlists", icon: ListMusic, href: `${base}/sets` },
            { label: "Team", icon: Users, href: `${base}/team` },
            { label: "Billing", icon: CreditCard, href: `${base}/billing` },
          ]
        : []),
      {
        id: "account",
        label: "Account",
        icon: Settings,
        children: [
          { label: "Profile", href: "/app/account" },
          { label: "Billing", href: "/app/account/billing" },
        ],
      },
    ],
    [base, orgSlug]
  );

  const isActive = (href: string) =>
    pathname === href || (href !== "/app" && pathname.startsWith(href));

  // auto-open relevant section if a child is active
  useEffect(() => {
    if (pathname.startsWith("/app/orgs")) setOpenChurches(true);
    if (pathname.startsWith("/app/account")) setOpenAccount(true);
  }, [pathname, setOpenAccount, setOpenChurches]);

  const railWidth = expanded ? "w-64" : "w-[76px]";

  const handleSignOut = async () => {
    const client = supabase();
    await client.auth.signOut();
    router.push("/login");
  };

  // --- Focus trap + ESC for mobile drawer ---
  const drawerRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    prevFocusRef.current = (document.activeElement as HTMLElement) ?? null;

    const container = drawerRef.current;
    if (!container) return;

    // focus first focusable
    const focusables = container.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    (focusables[0] || container).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.();
        return;
      }
      if (e.key !== "Tab") return;

      const list = Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled"));

      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const current = document.activeElement as HTMLElement;

      if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      }
    };

    container.addEventListener("keydown", onKeyDown);
    return () => {
      container.removeEventListener("keydown", onKeyDown);
      (returnFocusRef?.current || prevFocusRef.current)?.focus?.();
    };
  }, [open, onClose, returnFocusRef]);

  // Close on route change (mobile)
  useEffect(() => {
    if (!open) return;
    onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // --- renderers ---
  const renderSection = (section: NavSection) => {
    const Icon = section.icon;
    const anyChildActive = section.children.some((c) => isActive(c.href));

    const openState = section.id === "churches" ? openChurches : openAccount;
    const setOpenState = section.id === "churches" ? setOpenChurches : setOpenAccount;

    return (
      <li key={section.label}>
        <div className="flex items-center justify-between rounded-xl px-3 py-2 text-white/60">
          <button
            type="button"
            onClick={() => setOpenState(!openState)}
            aria-expanded={openState}
            className={["flex items-center gap-3", !expanded && "w-full justify-center"].join(" ")}
            title={!expanded ? section.label : undefined}
          >
            <span className="grid place-items-center h-9 w-9 rounded-lg bg-white/5">
              <Icon className="h-5 w-5" />
            </span>
            {expanded && (
              <span className="text-sm flex items-center gap-2 text-white/80">
                {section.label}
                <ChevronDown
                  className={[
                    "h-4 w-4 transition-transform",
                    openState ? "rotate-180" : "rotate-0",
                    anyChildActive ? "text-white" : "text-white/60",
                  ].join(" ")}
                  aria-hidden="true"
                />
              </span>
            )}
          </button>
        </div>

        {expanded && openState && (
          <ul className="ml-14 mt-1 space-y-1">
            {section.children.map((child) => (
              <li key={child.href}>
                <Link
                  href={child.href}
                  className={[
                    "block text-sm rounded-lg px-3 py-1",
                    isActive(child.href) ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5",
                  ].join(" ")}
                >
                  {child.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  const SidebarCard = (
    <aside
      className={[
        "flex flex-col",
        railWidth,
        "bg-[#0a0f2c] border-r border-white/5",
        "sticky top-[var(--header-h,64px)]",
        "h-[calc(100dvh-var(--header-h,64px))]",
      ].join(" ")}
      aria-label="Sidebar"
    >
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between gap-2 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/10 grid place-items-center text-sm font-semibold">WT</div>
          {expanded && (
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">WorshipTeam</div>
              <div className="text-xs text-white/60 truncate max-w-[10rem]">
                {orgName ?? "No church selected"}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={toggle}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          className="rounded-lg border border-white/10 text-white/80 hover:text-white px-2 py-1 hidden md:inline-block"
        >
          {expanded ? "«" : "»"}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="space-y-1">
          {nav.map((item) =>
            "children" in item ? (
              renderSection(item)
            ) : (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[
                    "group flex items-center gap-3 rounded-xl px-3 py-2",
                    isActive(item.href) ? "bg-white/10 text-white" : "text-white/80 hover:text-white hover:bg-white/5",
                  ].join(" ")}
                  title={!expanded ? item.label : undefined}
                >
                  <span
                    className={[
                      "grid place-items-center rounded-lg h-9 w-9",
                      isActive(item.href) ? "bg-indigo-600/30" : "bg-white/5 group-hover:bg-white/10",
                    ].join(" ")}
                  >
                    <item.icon className="h-5 w-5" />
                  </span>
                  {expanded && <span className="text-sm">{item.label}</span>}
                </Link>
              </li>
            )
          )}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/5">
        {expanded && <div className="mb-2 text-xs text-white/50 truncate">{userEmail ?? "—"}</div>}
        <button
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-white/80 hover:text-white hover:bg-white/5"
          title="Sign out"
          onClick={handleSignOut}
        >
          <span className="grid place-items-center h-9 w-9 rounded-lg bg-white/5">
            <LogOut className="h-5 w-5" />
          </span>
          {expanded && <span className="text-sm">Sign out</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Docked (md+) */}
      <div className="hidden md:block">{SidebarCard}</div>

      {/* Mobile drawer */}
      <div
        className={[
          "md:hidden fixed inset-0 z-50",
          open ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!open}
      >
        {/* Backdrop */}
        <div
          className={[
            "absolute inset-0 bg-black/50 transition-opacity",
            open ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onClick={onClose}
        />
        {/* Panel */}
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={[
            "absolute left-0",
            "top-[var(--header-h,64px)]",
            "h-[calc(100dvh-var(--header-h,64px))]",
            railWidth,
            "transition-transform",
            open ? "translate-x-0" : "-translate-x-full",
            "outline-none",
          ].join(" ")}
          tabIndex={-1}
        >
          <div className="h-full">{SidebarCard}</div>
        </div>
      </div>
    </>
  );
}
