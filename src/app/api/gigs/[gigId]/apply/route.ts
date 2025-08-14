import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/utils/supabase/server';

export async function POST(
  req: Request,
  { params }: { params: { gigId: string } }
) {
  const supabase = await createServerSupabase();

  // auth
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // optional body (e.g., a note/message)
  let note: string | null = null;
  try {
    const body = await req.json();
    note = typeof body?.note === 'string' ? body.note.trim() : null;
  } catch {
    // no body is fine
  }

  // If you have a `gig_applications` table: (gig_id, user_id, note, created_at)
  const { error } = await supabase
    .from('gig_applications')
    .insert({ gig_id: params.gigId, user_id: user.id, note });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
