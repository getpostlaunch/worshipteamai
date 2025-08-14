// src/app/api/gigs/[gigId]/apply/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/utils/supabase/server';

export async function POST(req: Request, ctx: any) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // params
  const gigId = (ctx?.params?.gigId as string) ?? '';
  if (!gigId) {
    return NextResponse.json({ error: 'gigId missing' }, { status: 400 });
  }

  // optional body
  let note: string | null = null;
  try {
    const body = await req.json();
    if (typeof body?.note === 'string') note = body.note.trim();
  } catch {
    // no body is fine
  }

  // adjust table/columns to your schema
  const { error } = await supabase
    .from('gig_applications')
    .insert({ gig_id: gigId, user_id: user.id, note });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
