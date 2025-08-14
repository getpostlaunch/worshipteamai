'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

type OrgLite = { id: string; name: string; slug: string; logo_url: string | null };

type Props = {
  org: OrgLite;
  canManage: boolean;
  isOwner: boolean;
};

export default function MobileOrgSidebar({ org, canManage }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  // create a dedicated portal root so it never sits inside a clipped parent
  useEffect(() => {
    setMounted(true);
    let el = document.getElementById('org-mobile-drawer-root') as HTMLElement | null;
    if (!el) {
      el = document.createElement('div');
      el.id = 'org-mobile-drawer-root';
      document.body.appendChild(el);
    }
    setPortalEl(el);
    return () => {
      // keep root around to avoid flicker between navigations
    };
  }, []);

  const sheet = (
    <div className="fixed inset-0 z-[9999] md:hidden">
      {/* Backdrop */}
      <button
        aria-label="Close menu"
        className="fixed inset-0 bg-black/60"
        onClick={() => setOpen(false)}
      />
      {/* Drawer */}
      <aside
        className="fixed left-0 top-0 h-[100dvh] w-72 overflow-y-auto border-r border-slate-800 bg-slate-950 shadow-2xl"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Organization menu"
      >
        <div className="flex items-center gap-3 p-4 border-b border-slate-800">
          {org.logo_url ? (
            <img
              src={org.logo_url}
              alt=""
              className="h-10 w-10 rounded bg-white object-contain p-1"
            />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded bg-slate-800 text-sm font-semibold">
              {org.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="truncate font-medium">{org.name}</div>
          <button
            className="ml-auto rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>

        <nav className="p-2 space-y-1">
          <NavLink href={`/app/orgs/${org.slug}`} onClick={() => setOpen(false)}>Overview</NavLink>
          <NavLink href={`/app/orgs/${org.slug}/sets`} onClick={() => setOpen(false)}>Manage setlists</NavLink>
          <NavLink href={`/app/orgs/${org.slug}/songs`} onClick={() => setOpen(false)}>Manage songs</NavLink>
          <NavLink href={`/app/orgs/${org.slug}/team`} onClick={() => setOpen(false)}>Team / Invite</NavLink>
          <NavLink
            href={`/app/orgs/${org.slug}/settings`}
            onClick={() => setOpen(false)}
            disabled={!canManage}
            title={canManage ? undefined : 'Owners/Leaders only'}
          >
            Edit org
          </NavLink>
        </nav>
      </aside>
    </div>
  );

  return (
    <>
      {/* Trigger lives in header */}
      <button
        className="md:hidden rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="org-mobile-drawer-root"
      >
        Menu
      </button>

      {mounted && open && portalEl ? createPortal(sheet, portalEl) : null}
    </>
  );
}

function NavLink({
  href,
  children,
  onClick,
  disabled,
  title,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  const base = 'block rounded-lg px-3 py-2 text-sm transition';
  const enabled = 'text-slate-200 hover:bg-slate-800';
  const off = 'text-slate-500 cursor-not-allowed';
  return disabled ? (
    <span className={`${base} ${off}`} title={title}>{children}</span>
  ) : (
    <Link href={href} className={`${base} ${enabled}`} title={title} onClick={onClick}>
      {children}
    </Link>
  );
}
