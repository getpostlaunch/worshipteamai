import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/utils/supabase/server';

export async function GET(
  _req: Request,
  { params }: { params: { orgId: string } }
) {
  const supabase = await createServerSupabase();

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('songs')
    .select('id, title, bpm, song_key, created_at')
    .eq('org_id', params.orgId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
