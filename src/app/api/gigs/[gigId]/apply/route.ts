import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/utils/supabase/server';

export async function POST(req: Request, { params }: { params: { gigId: string } }) {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { message, contact_email, contact_phone } = body;

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const { error } = await supabase.from('gig_applications').insert([{
    gig_id: params.gigId,
    applicant_id: auth.user.id,
    message,
    contact_email: contact_email ?? null,
    contact_phone: contact_phone ?? null,
  }]);

  // handle "already applied" unique constraint
  if (error?.code === '23505') {
    return NextResponse.json({ error: 'already_applied' }, { status: 409 });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true }, { status: 201 });
}
