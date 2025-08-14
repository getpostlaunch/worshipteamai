'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, Building2, Plus } from 'lucide-react';
import { supabase } from '@/utils/supabaseClient';

type Org = {
  id: string;
  name: string | null;
  slug: string;
  logo_url?: string | null;
};

export default function OrgSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const client = supabase();

      const { data: auth } = await client.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) { if (mounted) setLoading(false); return; }

      const { data: rows, error: mErr } = await client
        .from('org_memberships')
        .select('orgs:org_id ( id, name, slug, logo_url )')
        .eq('user_id', userId)
        .is('removed_at', null);

      if (mErr) {
        console.error(mErr);
        if (mounted) setLoading(false);
        return;
      }

      const list = (rows ?? [])
        .map((r: any) => r.orgs)
        .filter(Boolean) as Org[];

      if (mounted) setOrgs(list);

      const { data: pref } = await client
        .from('user_preferences')
        .select('last_selected_org_id')
        .eq('user_id', userId)
        .maybeSingle();

      const ids = list.map(o => o.id);
      const prefId = pref?.last_selected_org_id ?? null;
      const nextActive = prefId && ids.includes(prefId)
        ? prefId
        : (list[0]?.id ?? null);

      if (mounted) setActiveOrgId(nextActive);

      if (nextActive && nextActive !== prefId) {
        await client
          .from('user_preferences')
          .upsert({ user_id: userId, last_selected_org_id: nextActive }, { onConflict: 'user_id' });
      }

      if (mounted) setLoading(false);
    })();

    return () => { mounted = false; };
  }, []);

  // Click outside + Esc to close
  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown, { passive: true });
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const activeOrg = useMemo(
    () => orgs.find(o => o.id === activeOrgId) || null,
    [orgs, activeOrgId]
  );
  const initial = loading
    ? '…'
    : (activeOrg?.name?.trim()?.[0]?.toUpperCase() ?? 'C');

  const upsertPreferenceAndRoute = async (orgId: string) => {
    setSaving(true);
    try {
      const client = supabase();
      const { data: auth } = await client.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return;

      await client
        .from('user_preferences')
        .upsert({ user_id: userId, last_selected_org_id: orgId }, { onConflict: 'user_id' });

      setActiveOrgId(orgId);
      setOpen(false);

      const selected = orgs.find(o => o.id === orgId);
      if (!selected) return;

      if (pathname?.startsWith('/app/orgs/')) {
        const currentSlug = pathname.split('/')[3];
        if (currentSlug === selected.slug) return;

        const parts = pathname.split('/');
        const next = ['/app', 'orgs', selected.slug, ...parts.slice(4)].join('/');
        router.push(next);
      } else {
        router.push(`/app/orgs/${selected.slug}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!loading && orgs.length === 0) {
    return (
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-100 hover:bg-slate-800"
          aria-expanded={open}
          aria-label="Church menu"
        >
          <Building2 className="h-4 w-4" />
          <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl"
          >
            <button
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
              onClick={() => { setOpen(false); router.push('/app/orgs/new'); }}
            >
              <Plus className="h-4 w-4" />
              Create church account
            </button>
            <a
              href="/app/orgs"
              className="block px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
              onClick={() => setOpen(false)}
            >
              Learn more
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-2 py-2 text-sm text-slate-100 hover:bg-slate-800"
        aria-expanded={open}
        aria-label={activeOrg ? `Current church: ${activeOrg.name}. Open switcher.` : 'Open church switcher'}
      >
        <span
          className="grid h-6 w-6 place-items-center rounded-md bg-slate-800 text-[11px] font-semibold"
          aria-hidden
        >
          {initial}
        </span>
        <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl"
        >
          <div className="max-h-64 overflow-auto py-2">
            {orgs.map(org => (
              <button
                key={org.id}
                role="menuitem"
                onClick={() => upsertPreferenceAndRoute(org.id)}
                disabled={saving}
                className={[
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm',
                  org.id === activeOrgId
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-200 hover:bg-slate-800'
                ].join(' ')}
              >
                <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-800 text-[11px] font-semibold">
                  {(org.name?.trim()?.[0] || 'C').toUpperCase()}
                </span>
                <span className="truncate">{org.name ?? 'Unnamed Church'}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-slate-700 px-3 py-2">
            <a
              href="/app/orgs"
              className="block rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
              onClick={() => setOpen(false)}
            >
              Manage churches
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
