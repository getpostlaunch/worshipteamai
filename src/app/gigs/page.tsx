// src/app/gigs/page.tsx
import { createServerSupabase } from '@/utils/supabase/server';
import Link from 'next/link';

type SearchParams = {
  instrument?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zip?: string | null;
  date_from?: string | null; // YYYY-MM-DD
  date_to?: string | null;   // YYYY-MM-DD
  page?: string | null;
};

const PAGE_SIZE = 20;

export const dynamic = 'force-dynamic';

export default async function GigsIndex({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createServerSupabase();

  const page = Math.max(parseInt(searchParams.page || '1', 10) || 1, 1);
  const offset = (page - 1) * PAGE_SIZE;

  const status = 'open';
  const city = searchParams.city || undefined;
  const state = searchParams.state || undefined;
  const country = searchParams.country || undefined;
  const zip = searchParams.zip || undefined;
  const instrument = searchParams.instrument || undefined;
  const dateFrom = searchParams.date_from || undefined;
  const dateTo = searchParams.date_to || undefined;

  // Base gigs query (public readable via RLS)
  let q = supabase
    .from('gigs')
    .select(
      'id, slug, title, description_html, event_date, city, state, country, zip, open_to_paid, status, created_at',
      { count: 'exact' }
    )
    .eq('status', status)
    .order('event_date', { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  if (city) q = q.eq('city', city);
  if (state) q = q.eq('state', state);
  if (country) q = q.eq('country', country);
  if (zip) q = q.eq('zip', zip);
  if (dateFrom) q = q.gte('event_date', dateFrom);
  if (dateTo) q = q.lte('event_date', dateTo);

  const { data: gigs, error, count } = await q;
  if (error) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-4">Gigs</h1>
        <p className="text-red-500">Error: {error.message}</p>
      </div>
    );
  }

  // Instruments for filter dropdown
  const { data: instruments } = await supabase
    .from('instruments')
    .select('name')
    .eq('is_active', true)
    .order('name');

  // If instrument filter applied, fetch names for shown gigs
  let gigInstrumentNames: Record<string, string[]> = {};
  if (gigs?.length) {
    const { data: gi } = await supabase
      .from('gig_instruments')
      .select('gig_id, instruments(name)')
      .in('gig_id', gigs.map((g) => g.id));
    gigInstrumentNames = (gi || []).reduce<Record<string, string[]>>((acc, row: any) => {
      const n = row.instruments?.name;
      if (!n) return acc;
      (acc[row.gig_id] ||= []).push(n);
      return acc;
    }, {});
  }

  // If instrument filter present, filter the page results client‑side (server rendered)
  const filteredGigs =
    instrument && gigs
      ? gigs.filter((g) => (gigInstrumentNames[g.id] || []).includes(instrument))
      : gigs || [];

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // helper to keep other params when changing one
  const buildHref = (patch: Partial<SearchParams>) => {
    const sp = new URLSearchParams();
    const all: Record<string, string | undefined> = {
      instrument,
      city,
      state,
      country,
      zip,
      date_from: dateFrom,
      date_to: dateTo,
      page: String(patch.page ?? page),
      ...(patch as any),
    };
    Object.entries(all).forEach(([k, v]) => {
      if (v) sp.set(k, v);
    });
    return `/gigs?${sp.toString()}`;
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Gigs</h1>
      </div>

      {/* Filters (server-rendered form; GET) */}
      <form className="grid gap-3 md:grid-cols-6 bg-brand-4 rounded-2xl p-4 shadow-sm border border-gray-200 mb-6" method="get">
        <select
          name="instrument"
          defaultValue={instrument || ''}
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2"
        >
          <option value="">Any instrument</option>
          {(instruments || []).map((i) => (
            <option key={i.name} value={i.name}>
              {i.name}
            </option>
          ))}
        </select>

        <input name="city" placeholder="City" defaultValue={city || ''} className="rounded-xl border border-gray-300 px-3 py-2" />
        <input name="state" placeholder="State" defaultValue={state || ''} className="rounded-xl border border-gray-300 px-3 py-2" />
        <input name="zip" placeholder="ZIP" defaultValue={zip || ''} className="rounded-xl border border-gray-300 px-3 py-2" />

        <input
          type="date"
          name="date_from"
          defaultValue={dateFrom || ''}
          className="rounded-xl border border-gray-300 px-3 py-2"
        />
        <input
          type="date"
          name="date_to"
          defaultValue={dateTo || ''}
          className="rounded-xl border border-gray-300 px-3 py-2"
        />

        <div className="md:col-span-6 flex gap-3">
          <button className="rounded-xl bg-brand-1 text-white px-4 py-2">Search</button>
          <Link href="/gigs" className="rounded-xl border px-4 py-2">
            Reset
          </Link>
        </div>
      </form>

      {/* Results */}
      {filteredGigs.length === 0 ? (
        <p className="text-gray-600">No gigs found.</p>
      ) : (
        <ul className="space-y-4">
          {filteredGigs.map((g) => (
            <li key={g.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/gigs/${g.slug}`} className="text-lg font-semibold hover:underline">
                  {g.title}
                </Link>
                <div className="flex items-center gap-2">
                  {g.open_to_paid ? (
                    <span className="inline-block rounded-full border px-2 py-1 text-xs">Paid</span>
                  ) : null}
                  {g.event_date ? (
                    <span className="text-sm text-gray-600">{new Date(g.event_date).toLocaleDateString()}</span>
                  ) : null}
                </div>
              </div>
              <div className="mt-1 text-sm text-gray-600">
                {[g.city, g.state, g.zip].filter(Boolean).join(', ')}
              </div>
              {!!(gigInstrumentNames[g.id]?.length) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {gigInstrumentNames[g.id].map((name) => (
                    <span key={name} className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs">
                      {name}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3">
                <Link href={`/gigs/${g.slug}`} className="inline-block rounded-xl bg-brand-1 text-white px-3 py-2">
                  View gig
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      <div className="mt-8 flex items-center justify-between">
        <Link
          href={buildHref({ page: String(Math.max(1, page - 1)) })}
          className="rounded-xl border px-3 py-2 disabled:pointer-events-none disabled:opacity-50"
          aria-disabled={page <= 1}
        >
          Previous
        </Link>
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>
        <Link
          href={buildHref({ page: String(Math.min(totalPages, page + 1)) })}
          className="rounded-xl border px-3 py-2 disabled:pointer-events-none disabled:opacity-50"
          aria-disabled={page >= totalPages}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
