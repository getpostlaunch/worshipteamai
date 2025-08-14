import { redirect, notFound } from 'next/navigation';
import { createServerSupabase } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

type Params = { orgSlug: string };

export default async function OrgDashboardPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { orgSlug } = await params;
  const supabase = await createServerSupabase();

  // Auth
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) redirect('/login');

  // slug -> org (include created_by so creators are treated as allowed)
  const { data: org, error: orgErr } = await supabase
    .from('orgs')
    .select('id, slug, name, created_by')
    .eq('slug', orgSlug)
    .maybeSingle();

  if (orgErr) notFound();
  if (!org) notFound();

  const isCreator = org.created_by === user.id;

  // Ensure membership (best-effort; allow creator even if membership row missing / RLS blocks read)
  let isMember = false;
  try {
    const { data: mem } = await supabase
      .from('org_memberships')
      .select('id')
      .eq('org_id', org.id)
      .eq('user_id', user.id)
      .is('removed_at', null)
      .maybeSingle();

    isMember = !!mem;
  } catch {
    // If RLS blocks the read, fall back to creator allowance
    isMember = false;
  }

  if (!isMember && isCreator) {
    // Backfill membership for creator (ignore errors)
    try {
      await supabase.from('org_memberships').upsert(
        { org_id: org.id, user_id: user.id, role: 'owner' },
        { onConflict: 'org_id,user_id' }
      );
      isMember = true;
    } catch {
      // ignore
    }
  }

  if (!isMember && !isCreator) {
    // Not a member and not the creator: send to chooser
    redirect('/app/orgs');
  }

  // Sync preference (best-effort)
  try {
    const { data: pref } = await supabase
      .from('user_preferences')
      .select('last_selected_org_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (pref?.last_selected_org_id !== org.id) {
      await supabase
        .from('user_preferences')
        .upsert({ user_id: user.id, last_selected_org_id: org.id }, { onConflict: 'user_id' });
    }
  } catch {
    // ignore
  }

  // Recent sets
  let sets: { id: string; name: string | null; service_date: string | null; created_at: string }[] = [];
  try {
    const { data: setsData } = await supabase
      .from('sets')
      .select('id, name, service_date, created_at')
      .eq('org_id', org.id)
      .order('service_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5);
    sets = setsData ?? [];
  } catch {
    sets = [];
  }

  // Recent songs
  let songs: { id: string; title: string | null; created_at: string; status: string | null }[] = [];
  try {
    const { data: songsData } = await supabase
      .from('songs')
      .select('id, title, created_at, status')
      .eq('org_id', org.id)
      .order('created_at', { ascending: false })
      .limit(5);
    songs = songsData ?? [];
  } catch {
    songs = [];
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">{org.name}</h1>
        <div className="flex items-center gap-2">
          <a
            href={`/app/orgs/${org.slug}/sets`}
            className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            View sets
          </a>
          <a
            href={`/app/orgs/${org.slug}/songs`}
            className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            View songs
          </a>
          <a
            href={`/app/orgs/${org.slug}/team`}
            className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Team
          </a>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Recent Sets */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40">
          <header className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-lg font-medium text-white">Recent setlists</h2>
          </header>
          <ul className="divide-y divide-slate-800">
            {sets.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-3">
                <div className="text-white">
                  <a href={`/app/orgs/${org.slug}/sets/${s.id}`} className="hover:underline">
                    {s.name || 'Untitled'}
                  </a>
                  <div className="text-xs text-slate-400">
                    {s.service_date ? new Date(String(s.service_date)).toDateString() : 'No date'}
                  </div>
                </div>
                <a
                  href={`/app/orgs/${org.slug}/sets/${s.id}`}
                  className="text-sm text-slate-300 hover:text-white"
                >
                  Open →
                </a>
              </li>
            ))}
            {sets.length === 0 && <li className="px-4 py-6 text-sm text-slate-400">No sets yet.</li>}
          </ul>
        </section>

        {/* Recent Songs */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40">
          <header className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-lg font-medium text-white">Recent songs</h2>
          </header>
          <ul className="divide-y divide-slate-800">
            {songs.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-3">
                <div className="text-white">{s.title || 'Untitled'}</div>
                <a
                  href={`/app/orgs/${org.slug}/practice/${s.id}`}
                  className="text-sm text-slate-300 hover:text-white"
                >
                  Practice →
                </a>
              </li>
            ))}
            {songs.length === 0 && <li className="px-4 py-6 text-sm text-slate-400">No songs yet.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
