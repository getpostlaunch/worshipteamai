import { createServerSupabase } from '@/utils/supabase/server';
import Image from 'next/image';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type SearchParams = {
  q?: string;
  instrument?: string;
  gender?: string;
  city?: string;
  zip?: string;
};

type InstrumentRow = { id: string; name: string };

type UserRow = {
  id: string;
  display_name: string | null;
  username: string;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip: string | null;
  gender: string | null;
  open_to_gigs: boolean;
  user_instruments: { instruments: { name: string } | { name: string }[] }[];
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createServerSupabase();

  // ---- Filter options (normalize null -> []) ----
  const { data: instrumentOptionsRaw } = await supabase
    .from('instruments')
    .select('id,name')
    .order('name');

  const instrumentOptions: InstrumentRow[] = (instrumentOptionsRaw ?? []) as InstrumentRow[];

  // ---- Parse filters ----
  const q = (searchParams.q ?? '').trim();
  const instrument = (searchParams.instrument ?? '').trim();
  const gender = (searchParams.gender ?? '').trim();
  const city = (searchParams.city ?? '').trim();
  const zip = (searchParams.zip ?? '').trim();

  // ---- Base query ----
  let qry = supabase
    .from('profiles')
    .select(
      `
        id,
        display_name,
        username,
        avatar_url,
        city,
        state,
        country,
        zip,
        gender,
        open_to_gigs,
        user_instruments:user_instruments(
          instruments(name)
        )
      `
    )
    .eq('open_to_gigs', true)
    .order('updated_at', { ascending: false });

  if (q) {
    const safe = q.replaceAll('%', '').replaceAll(',', ' ');
    qry = qry.or(`display_name.ilike.%${safe}%,username.ilike.%${safe}%`);
  }
  if (gender) qry = qry.eq('gender', gender);
  if (city) qry = qry.ilike('city', city);
  if (zip) qry = qry.eq('zip', zip);

  // Instrument inner join if filtering by instrument
  if (instrument) {
    qry = supabase
      .from('profiles')
      .select(
        `
        id,
        display_name,
        username,
        avatar_url,
        city,
        state,
        country,
        zip,
        gender,
        open_to_gigs,
        user_instruments:user_instruments!inner(
          instruments!inner(name)
        )
      `
      )
      .eq('open_to_gigs', true)
      .eq('user_instruments.instruments.name', instrument)
      .order('updated_at', { ascending: false });

    if (q) {
      const safe = q.replaceAll('%', '').replaceAll(',', ' ');
      qry = qry.or(`display_name.ilike.%${safe}%,username.ilike.%${safe}%`);
    }
    if (gender) qry = qry.eq('gender', gender);
    if (city) qry = qry.ilike('city', city);
    if (zip) qry = qry.eq('zip', zip);
  }

  // ---- Fetch & normalize users (null -> []) ----
  const { data: usersRaw, error } = await qry;
  const users: UserRow[] = (usersRaw ?? []) as UserRow[];

  if (error) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Musicians open to gigs</h1>
        <p className="text-red-600 text-sm">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Musicians open to gigs</h1>

      {/* Filters */}
      <UsersFilters
        instruments={instrumentOptions.map((i) => i.name)}
        initial={{ q, instrument, gender, city, zip }}
      />

      {/* Results */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => {
          const loc = [u.city, u.state, u.country].filter(Boolean).join(', ');
          // handle both object and array shapes for instruments join
          const chips: string[] = (u.user_instruments || [])
            .flatMap((r) => {
              const ins = r?.instruments as any;
              if (!ins) return [];
              return Array.isArray(ins) ? ins.map((x) => x?.name).filter(Boolean) : [ins.name].filter(Boolean);
            })
            .filter(Boolean);

          return (
            <Link
              key={u.id}
              href={`/app/users/${u.username}`}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-100">
                  {u.avatar_url ? (
                    <Image
                      src={u.avatar_url}
                      alt={u.display_name || u.username}
                      width={48}
                      height={48}
                      className="h-12 w-12 object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate font-medium text-slate-900">
                      {u.display_name || u.username}
                    </div>
                    {u.gender ? (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-700">
                        {u.gender}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-slate-600 truncate">@{u.username}</div>
                  {loc ? (
                    <div className="text-xs text-slate-600 truncate">
                      {loc}
                      {u.zip ? ` • ${u.zip}` : ''}
                    </div>
                  ) : null}
                </div>
              </div>

              {chips.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {chips.slice(0, 6).map((c) => (
                    <span
                      key={c}
                      className="inline-block rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : null}
            </Link>
          );
        })}
      </div>

      {users.length === 0 ? (
        <div className="mt-10 text-center text-sm text-slate-600">
          No matching musicians yet.
        </div>
      ) : null}
    </div>
  );
}

// --- Client filter bar stub (real component next to this file) ---
function UsersFilters({
  instruments,
  initial,
}: {
  instruments: string[];
  initial: SearchParams;
}) {
  return null;
}

export { default as UsersFilters } from './UsersFilters';
