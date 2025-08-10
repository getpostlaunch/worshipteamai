'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import { PropsWithChildren } from 'react';

const nav = [
  { href: '/account', label: 'Profile' },
  { href: '/account/billing', label: 'Billing' },
  // add more later (Notifications, Security, etc.)
];

export default function AccountLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    await supabase().auth.signOut();
    router.replace('/'); // back to marketing home
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
      {/* Sidebar */}
      <aside
        style={{
          position: 'sticky',
          top: 64,
          alignSelf: 'start',
          borderRight: '1px solid #eee',
          paddingRight: 16,
          minHeight: 'calc(100vh - 96px)',
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <strong style={{ fontSize: 18 }}>Your Account</strong>
          <p style={{ color: '#666', marginTop: 4, fontSize: 13 }}>
            Manage profile, billing, and more.
          </p>
        </div>

        <nav style={{ display: 'grid', gap: 6 }}>
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  color: active ? '#111' : '#222',
                  background: active ? '#f6f6f6' : 'transparent',
                  fontWeight: active ? 600 : 500,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: 16 }}>
          <button
            onClick={signOut}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #eee',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>

        {/* Mobile hint */}
        <p style={{ color: '#888', fontSize: 12, marginTop: 12 }}>
          Tip: on smaller screens this sidebar stacks above the content.
        </p>
      </aside>

      {/* Content */}
      <section style={{ minWidth: 0 }}>{children}</section>

      {/* Responsive: stack on small screens */}
      <style>{`
        @media (max-width: 860px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
          aside {
            position: static !important;
            border-right: none !important;
            border-bottom: 1px solid #eee;
            padding-bottom: 16px;
            margin-bottom: 16px;
          }
        }
      `}</style>
    </div>
  );
}
