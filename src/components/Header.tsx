'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const nav = [
  { href: '/app', label: 'App' },
  { href: '/how-tos', label: 'How-tos' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Blog' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        background: '#fff',
        borderBottom: '1px solid #eee',
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Link href="/" style={{ textDecoration: 'none', color: '#111' }}>
          <strong style={{ fontSize: 18, letterSpacing: 0.2 }}>WorshipTeam AI</strong>
        </Link>

        {/* Desktop nav */}
        <nav className="wtai-desktop-nav" style={{ display: 'none', gap: 16 }}>
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  textDecoration: 'none',
                  color: active ? '#111' : '#222',
                  fontWeight: active ? 600 : 500,
                }}
              >
                {item.label}
              </Link>
            );
          })}
          <Link href="/login" style={{ textDecoration: 'none', color: '#111', fontWeight: 600 }}>
            Login
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          className="wtai-mobile-button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 8,
            background: '#fff',
            border: '1px solid #e5e5e5',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          {/* Simple hamburger */}
          <span
            aria-hidden
            style={{
              width: 18,
              height: 2,
              background: '#111',
              display: 'block',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: -6,
                width: 18,
                height: 2,
                background: '#111',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: 6,
                width: 18,
                height: 2,
                background: '#111',
              }}
            />
          </span>
        </button>
      </div>

      {/* Mobile nav drawer */}
      {open && (
        <div style={{ borderTop: '1px solid #eee', background: '#fff' }}>
          <nav
            style={{
              maxWidth: 1440,
              margin: '0 auto',
              padding: '8px 16px 16px',
              display: 'grid',
              gap: 8,
            }}
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{ textDecoration: 'none', color: '#111', padding: '8px 0' }}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)} style={{ textDecoration: 'none', color: '#111' }}>
              Login
            </Link>
          </nav>
        </div>
      )}

      {/* Tiny CSS to swap desktop/mobile */}
      <style>{`
        @media (min-width: 768px) {
          .wtai-desktop-nav { display: inline-flex !important; }
          .wtai-mobile-button { display: none !important; }
        }
      `}</style>
    </header>
  );
}
