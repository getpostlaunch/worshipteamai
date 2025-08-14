import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/utils/supabase/server';

/**
 * GET /api/songs/:songId/regions
 * Returns ONLY the caller's regions for the song.
 */
export async function GET(
  _req: Request,
  { params }: { params: { songId: string } }
) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('song_regions')
    .select('id, name, start_seconds, end_seconds')
    .eq('song_id', params.songId)
    .eq('user_id', user.id)
    .order('start_seconds', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, regions: data ?? [] });
}

/**
 * POST /api/songs/:songId/regions
 * Body: { name?: string, label?: string, start_seconds?: number, start_sec?: number, end_seconds?: number, end_sec?: number }
 * Accepts both old (label/start_sec/end_sec) and new (name/start_seconds/end_seconds) shapes.
 */
export async function POST(
  req: Request,
  { params }: { params: { songId: string } }
) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({} as any));

  const name: string = body.name ?? body.label ?? 'Region';

  const start_seconds: number | null =
    typeof body.start_seconds === 'number'
      ? body.start_seconds
      : typeof body.start_sec === 'number'
      ? body.start_sec
      : null;

  const end_seconds: number | null =
    typeof body.end_seconds === 'number'
      ? body.end_seconds
      : typeof body.end_sec === 'number'
      ? body.end_sec
      : null;

  if (
    !params.songId ||
    start_seconds === null ||
    end_seconds === null ||
    Number.isNaN(start_seconds) ||
    Number.isNaN(end_seconds)
  ) {
    return NextResponse.json(
      { error: 'Invalid payload: require start_seconds and end_seconds' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('song_regions')
    .insert({
      song_id: params.songId,
      user_id: user.id, // required by RLS (private per member)
      name,
      start_seconds,
      end_seconds,
    })
    .select('id, name, start_seconds, end_seconds')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, region: data });
}
