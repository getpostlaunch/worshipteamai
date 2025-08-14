import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/utils/supabase/server';

export async function PUT(
  req: Request,
  { params }: { params: { regionId: string } }
) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  // Only update provided fields; leave others untouched
  const payload: Record<string, any> = {};
  if ('label' in body) payload.label = body.label;
  if ('start_sec' in body) payload.start_sec = body.start_sec;
  if ('end_sec' in body) payload.end_sec = body.end_sec;
  if ('loop' in body) payload.loop = body.loop;
  if ('color' in body) payload.color = body.color;

  const { data, error } = await supabase
    .from('user_song_regions')
    .update(payload)
    .eq('id', params.regionId)
    .eq('user_id', user.id) // extra safety; RLS should also enforce
    .select('id,label,start_sec,end_sec,loop,color,created_at,updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, region: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { regionId: string } }
) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('user_song_regions')
    .delete()
    .eq('id', params.regionId)
    .eq('user_id', user.id); // extra safety with RLS

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
