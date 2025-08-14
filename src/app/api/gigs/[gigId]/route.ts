import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/utils/supabase/server';

type Instrument = { name: string };
const toNames = (ins: Instrument | Instrument[] | null | undefined) =>
  Array.isArray(ins) ? ins.map(i => i?.name).filter(Boolean) : ins?.name ? [ins.name] : [];

export async function GET(_req: Request, { params }: { params: { gigId: string } }) {
  const supabase = await createServerSupabase();

  const { data: gig, error } = await supabase
    .from('gigs')
    .select('id, slug, title, description_html, event_date, city, state, country, zip, open_to_paid, status, org_id, created_by, created_at, updated_at')
    .eq('id', params.gigId)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const [{ data: gi, error: giErr }, { data: insts, error: instErr }] = await Promise.all([
    supabase.from('gig_instruments').select('instrument_id, need').eq('gig_id', params.gigId),
    supabase.from('gig_instruments').select('gig_id, instruments(name)').eq('gig_id', params.gigId),
  ]);
  if (giErr || instErr) return NextResponse.json({ error: giErr?.message || instErr?.message }, { status: 400 });

  const names = (insts ?? []).flatMap(r => toNames(r?.instruments));
  return NextResponse.json({ gig, instruments: gi || [], instrument_names: names });
}

export async function PUT(req: Request, { params }: { params: { gigId: string } }) {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, any> = {};
  for (const k of [
    'title','description_html','event_date','city','state','country','zip','open_to_paid','status'
  ]) if (k in body) patch[k] = body[k];

  if (Object.keys(patch).length) {
    const { error } = await supabase.from('gigs').update(patch).eq('id', params.gigId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // replace instruments if provided
  if (Array.isArray(body.instruments)) {
    const rows = body.instruments.map((r: any) => ({
      gig_id: params.gigId,
      instrument_id: r.instrument_id,
      need: r.need ?? 'required',
    }));
    const { error: delErr } = await supabase.from('gig_instruments').delete().eq('gig_id', params.gigId);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 });
    if (rows.length) {
      const { error: insErr } = await supabase.from('gig_instruments').insert(rows);
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { gigId: string } }) {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { error } = await supabase.from('gigs').delete().eq('id', params.gigId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
