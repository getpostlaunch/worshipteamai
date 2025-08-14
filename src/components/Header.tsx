'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import OrgSwitcher from "@/components/OrgSwitcher";

type User = {
  name: string;
  email: string;
  avatarUrl?: string | null;
};

type Props = {
  user?: User | null; // show avatar + dropdown when present
};

const NAV = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Blog' },
  { href: '/projects', label: 'Projects' },
  { href: '/calendar', label: 'Calendar' },
];

export default function Header({ user }: Props) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const avatarSrc =
    user?.avatarUrl && user.avatarUrl.trim() !== ''
      ? user.avatarUrl
      : '/assets/images/avatar.webp';

  // close dropdown on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-slate-900 text-white">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left: logo + desktop nav */}
            <div className="flex items-center gap-8">
              {/* Mobile: hamburger */}
              <button
                className="mr-1 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 lg:hidden"
                aria-label="Open menu"
                onClick={() => setOpen(true)}
              >
                {/* hamburger icon */}
                <span className="block h-0.5 w-5 bg-current"></span>
                <span className="block h-0.5 w-5 bg-current mt-1.5"></span>
                <span className="block h-0.5 w-5 bg-current mt-1.5"></span>
              </button>

              {/* Logo */}
              <a href="/" className="flex items-center gap-2">
                <Image src="/assets/images/logo.svg" alt="WorshipTeam AI" width={100} height={40} />
              </a>

              {/* Desktop nav */}
              <nav className="hidden lg:flex items-center gap-8">
                {NAV.map((n) => (
                  <a
                  key={n.href}
                  href={n.href}
                  className="text-slate-300 hover:text-white hover:bg-slate-800 transition rounded-xl px-4 py-2"
                  >
                    {n.label}
                  </a>
                ))}
              </nav>
            </div>

            {/* Right: CTA + (desktop avatar dropdown when logged in) */}
            <div className="flex items-center gap-4">
              {!user && (
                <>
                  <a
                    href="/login"
                    className="inline-flex items-center gap-2 px-4 py-2 text-white"
                  >
                    <span className="font-regular">Login</span>
                  </a>
                  <a
                    href="/signup"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-white shadow hover:bg-indigo-400 transition"
                  >
                    <span className="font-bold">Try Free</span>
                  </a>
                </>
              )}

              {user && (
                <>
                  {/* App button replaces Try Free */}
                  <OrgSwitcher />
                  <a
                    href="/app"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 pt-2 pb-2 pr-8 pl-8 text-white shadow hover:bg-indigo-400 transition"
                  >
                    <span className="font-bold">App</span>
                  </a>

                  {/* Desktop avatar + dropdown */}
                  <div className="relative hidden lg:block mt-1" ref={menuRef}>
                    <button
                      onClick={() => setMenuOpen(v => !v)}
                      aria-haspopup="menu"
                      aria-expanded={menuOpen}
                      className="cursor-pointer inline-flex h-10 w-10 overflow-hidden rounded-full ring-1 ring-slate-700 hover:ring-slate-500"
                    >
                      <img src={avatarSrc} alt={user.name || 'User'} className="h-full w-full object-cover" />
                    </button>

                    {menuOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-900/95 shadow-xl backdrop-blur p-2"
                      >
                        <a href="/app/account" className="block rounded-lg px-3 py-2 text-slate-200 hover:bg-slate-800" role="menuitem">
                          Account
                        </a>
                        <a href="/app/billing" className="block rounded-lg px-3 py-2 text-slate-200 hover:bg-slate-800" role="menuitem">
                          Billing
                        </a>
                        <a href="/logout" className="block rounded-lg px-3 py-2 text-slate-200 hover:bg-slate-800" role="menuitem">
                          Logout
                        </a>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile slide-over */}
      <div
        className={[
          'fixed inset-0 z-[60] lg:hidden transition',
          open ? 'pointer-events-auto' : 'pointer-events-none',
        ].join(' ')}
      >
        {/* Backdrop */}
        <div
          className={['absolute inset-0 bg-black/40 transition-opacity', open ? 'opacity-100' : 'opacity-0'].join(' ')}
          onClick={() => setOpen(false)}
        />
        {/* Panel */}
        <aside
          className={[
            'absolute left-0 top-0 h-full w-[88%] max-w-sm rounded-2xl bg-slate-900 text-white shadow-2xl',
            'transition-transform duration-300',
            open ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          <div className="p-4 flex items-center justify-between">
            <button
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 text-slate-300"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              {/* X icon */}
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <Image src="/assets/images/logo.svg" alt="WorshipTeam AI" width={100} height={40} />
            </div>
          </div>

          <div className="px-4">
            <nav className="space-y-3">
              {NAV.map((n, i) => (
                <a
                  key={n.href}
                  href={n.href}
                  className={[
                    'block rounded-xl px-4 py-3 text-lg text-slate-200 hover:bg-slate-800',
                    i === 0 && 'bg-slate-800',
                  ].join(' ')}
                  onClick={() => setOpen(false)}
                >
                  {n.label}
                </a>
              ))}
            </nav>

            {/* Divider */}
            <div className="my-6 h-px bg-slate-800" />

            {/* User block (unchanged for mobile) */}
            {user && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarSrc} alt={user.name || 'User'} className="h-12 w-12 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{user.name}</p>
                    <p className="truncate text-sm text-slate-400">{user.email}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3 text-slate-300">
                  <a href="/account" className="block px-2 py-2 rounded-lg hover:bg-slate-800">Your profile</a>
                  <a href="/settings" className="block px-2 py-2 rounded-lg hover:bg-slate-800">Settings</a>
                  <a href="/logout" className="block px-2 py-2 rounded-lg hover:bg-slate-800">Sign out</a>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
