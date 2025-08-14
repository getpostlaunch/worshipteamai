import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/utils/supabase/server';

export async function POST(req: Request, ctx: any) {
  const supabase = await createServerSupabase();

  // auth
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // params
  const orgId = (ctx?.params?.orgId as string) ?? '';
  if (!orgId) {
    return NextResponse.json({ error: 'orgId missing' }, { status: 400 });
  }

  // body
  let email = '';
  try {
    const body = await req.json();
    email = String(body?.email || '').trim();
  } catch {}
  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  // (optional) verify membership/role here

  const { error } = await supabase
    .from('org_invites')
    .insert({ org_id: orgId, email, invited_by: user.id });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
