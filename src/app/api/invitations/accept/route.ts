import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/utils/supabase/server';

export async function POST(req: Request) {
  const supabase = await createServerSupabase();

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let inviteId = '';
  try {
    const body = await req.json();
    inviteId = String(body?.inviteId || '').trim();
  } catch {}
  if (!inviteId) {
    return NextResponse.json({ error: 'inviteId required' }, { status: 400 });
  }

  const { data: invite, error: inviteErr } = await supabase
    .from('org_invites')
    .select('id, org_id, email')
    .eq('id', inviteId)
    .single();

  if (inviteErr || !invite) {
    return NextResponse.json({ error: 'invite not found' }, { status: 404 });
  }

  // Add membership (idempotent upsert if you prefer)
  const { error: memErr } = await supabase
    .from('org_memberships')
    .insert({ org_id: invite.org_id, user_id: user.id, role: 'member' });

  if (memErr) {
    return NextResponse.json({ error: memErr.message }, { status: 400 });
  }

  // Delete invite (optional)
  await supabase.from('org_invites').delete().eq('id', invite.id);

  return NextResponse.json({ ok: true });
}
