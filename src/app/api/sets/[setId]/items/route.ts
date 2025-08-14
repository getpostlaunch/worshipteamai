import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/utils/supabase/server';

export async function POST(
  req: Request,
  { params }: { params: { setId: string } }
) {
  const supabase = await createServerSupabase();

  // (optional) auth gate
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // body
  let song_id: string | null = null;
  try {
    const body = await req.json();
    song_id = String(body?.song_id || '').trim() || null;
  } catch {}
  if (!song_id) {
    return NextResponse.json({ error: 'song_id required' }, { status: 400 });
  }

  // find current max sort_index in this set
  const { data: existing, error: maxErr } = await supabase
    .from('set_items')
    .select('sort_index')
    .eq('set_id', params.setId)
    .order('sort_index', { ascending: false })
    .limit(1);

  if (maxErr) {
    return NextResponse.json({ error: maxErr.message }, { status: 400 });
  }

  const nextIndex = ((existing?.[0]?.sort_index as number | undefined) ?? -1) + 1;

  // insert new item
  const { data, error } = await supabase
    .from('set_items')
    .insert({ set_id: params.setId, song_id, sort_index: nextIndex })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ id: data!.id });
}
