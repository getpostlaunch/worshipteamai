import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/utils/supabase/server';

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

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // ignore; handled below
  }

  const { file_path, status, bpm, song_key, title } = body ?? {};

  // Only set fields that were provided
  const update: Record<string, any> = {};
  if ('file_path' in (body ?? {})) update.file_path = file_path ?? null;
  if ('status' in (body ?? {})) update.status = status ?? 'uploaded';
  if ('bpm' in (body ?? {})) update.bpm = bpm ?? null;
  if ('song_key' in (body ?? {})) update.song_key = song_key ?? null;
  if ('title' in (body ?? {})) update.title = title ?? null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'no fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('songs')
    .update(update)
    .eq('id', params.songId)
    .eq('user_id', user.id) // safety: only update your own song
    .select('id, title, status, bpm, song_key, file_path, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, song: data });
}
