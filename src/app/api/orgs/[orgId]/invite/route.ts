import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/utils/supabase/server';

export async function POST(
  req: Request,
  { params }: { params: { orgId: string } }
) {
  const supabase = await createServerSupabase();

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let email = '';
  try {
    const body = await req.json();
    email = String(body?.email || '').trim();
  } catch {}
  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  // (optional) verify membership/role here before inserting

  const { error } = await supabase
    .from('org_invites')
    .insert({ org_id: params.orgId, email, invited_by: user.id });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
