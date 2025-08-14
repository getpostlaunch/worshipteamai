'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase as createBrowserSupabase } from '@/utils/supabaseClient';
import { Building2, Plus, ChevronRight } from 'lucide-react';

type Org = {
  id: string;
  slug: string;
  name: string | null;
  logo_url: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
};

function fmtAddr(o: Org) {
  const parts = [o.street, [o.city, o.state].filter(Boolean).join(', '), o.postal_code].filter(Boolean);
  return parts.join(' • ');
}

export default function OrgsIndexPage() {
  const router = useRouter();
  const supabase = createBrowserSupabase();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login?next=/app/orgs'); return; }

      const { data: rows, error } = await supabase
        .from('org_memberships')
        .select('orgs:org_id ( id, slug, name, logo_url, street, city, state, postal_code )')
        .eq('user_id', user.id)
        .is('removed_at', null);

      if (!error) {
        setOrgs((rows ?? []).map((r: any) => r.orgs).filter(Boolean));
      }
      setLoading(false);
    })();
  }, [router, supabase]);

  const openOrg = async (o: Org) => {
    setSavingId(o.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login?next=/app/orgs'); return; }

      await supabase
        .from('user_preferences')
        .upsert({ user_id: user.id, last_selected_org_id: o.id }, { onConflict: 'user_id' });

      router.push(`/app/orgs/${o.slug}`);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <main className="mx-auto max-w-screen-lg px-4 py-12 text-slate-300">Loading…</main>;
  }

  return (
    <main className="mx-auto max-w-screen-lg px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-white/80" />
          <h1 className="text-xl font-semibold text-white">Your churches</h1>
        </div>
        <Link
          href="/app/orgs/new"
          className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-white hover:bg-white/15"
        >
          <Plus className="h-4 w-4" />
          Create church
        </Link>
      </div>

      {orgs.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-200">
          You’re not part of any churches yet.
        </div>
      ) : (
        <ul className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/40">
          {orgs.map((o) => (
            <li key={o.id} className="px-4 py-3 hover:bg-slate-900">
              <button
                type="button"
                onClick={() => openOrg(o)}
                disabled={savingId === o.id}
                className="flex w-full items-center gap-4 text-left"
              >
                <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                  {o.logo_url ? (
                    <Image
                      src={o.logo_url}
                      alt={o.name ?? 'Church logo'}
                      fill
                      sizes="48px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-500">
                      <Building2 className="h-5 w-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-white">
                    {savingId === o.id ? 'Opening…' : (o.name ?? 'Unnamed Church')}
                  </div>
                  <div className="truncate text-sm text-slate-400">{fmtAddr(o) || 'No address'}</div>
                </div>

                <ChevronRight className="h-4 w-4 text-slate-500" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
