import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/utils/supabase/server';

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

export async function GET(req: Request) {
  const supabase = await createServerSupabase();
  const { searchParams } = new URL(req.url);

  const status = searchParams.get('status') ?? 'open';
  const city = searchParams.get('city') || undefined;
  const state = searchParams.get('state') || undefined;
  const country = searchParams.get('country') || undefined;
  const zip = searchParams.get('zip') || undefined;
  const instrument = searchParams.get('instrument') || undefined; // instrument name
  const dateFrom = searchParams.get('date_from') || undefined;    // YYYY-MM-DD
  const dateTo = searchParams.get('date_to') || undefined;        // YYYY-MM-DD
  const limit = Number(searchParams.get('limit') ?? 20);
  const offset = Number(searchParams.get('offset') ?? 0);

  // base gigs
  let q = supabase
    .from('gigs')
    .select('id, slug, title, description_html, event_date, city, state, country, zip, open_to_paid, status, org_id, created_at', { count: 'exact' })
    .eq('status', status)
    .order('event_date', { ascending: true })
    .range(offset, offset + limit - 1);

  if (city) q = q.eq('city', city);
  if (state) q = q.eq('state', state);
  if (country) q = q.eq('country', country);
  if (zip) q = q.eq('zip', zip);
  if (dateFrom) q = q.gte('event_date', dateFrom);
  if (dateTo) q = q.lte('event_date', dateTo);

  const { data: gigs, error, count } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // optional instrument filter (name)
  if (instrument) {
    const { data: rows, error: giErr } = await supabase
      .from('gig_instruments')
      .select('gig_id, instruments(name)')
      .in('gig_id', (gigs || []).map(g => g.id));
    if (giErr) return NextResponse.json({ error: giErr.message }, { status: 400 });
    const keep = new Set(rows?.filter(r => r.instruments?.name === instrument).map(r => r.gig_id));
    return NextResponse.json({
      gigs: (gigs || []).filter(g => keep.has(g.id)),
      total: count ?? 0,
    });
  }

  return NextResponse.json({ gigs: gigs || [], total: count ?? 0 });
}

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    org_id,
    title,
    description_html,
    event_date,
    city,
    state,
    country,
    zip,
    open_to_paid = false,
    status = 'open',
    instruments = [] as { instrument_id: string; need?: 'required' | 'preferred' }[],
  } = body;

  if (!org_id || !title || !description_html) {
    return NextResponse.json({ error: 'org_id, title, description_html are required' }, { status: 400 });
  }

  // create slug (ensure uniqueness by appending short id if needed)
  const baseSlug = slugify(title);
  let slug = baseSlug;
  for (let i = 0; i < 5; i++) {
    const { data: exists } = await supabase.from('gigs').select('id').eq('slug', slug).maybeSingle();
    if (!exists) break;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const { data: gig, error } = await supabase
    .from('gigs')
    .insert([{
      org_id,
      created_by: auth.user.id,
      slug,
      title,
      description_html,
      event_date,
      city, state, country, zip,
      open_to_paid,
      status,
    }])
    .select('id, slug')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // insert instruments
  if (Array.isArray(instruments) && instruments.length) {
    const rows = instruments.map((r) => ({
      gig_id: gig.id,
      instrument_id: r.instrument_id,
      need: r.need ?? 'required',
    }));
    const { error: giErr } = await supabase.from('gig_instruments').insert(rows);
    if (giErr) return NextResponse.json({ error: giErr.message }, { status: 400 });
  }

  return NextResponse.json({ id: gig.id, slug: gig.slug }, { status: 201 });
}
