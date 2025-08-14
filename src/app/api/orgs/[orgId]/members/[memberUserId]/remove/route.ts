// src/app/api/orgs/[orgId]/members/[memberUserId]/remove/route.ts
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

  const orgId = (ctx?.params?.orgId as string) ?? '';
  const memberUserId = (ctx?.params?.memberUserId as string) ?? '';
  if (!orgId || !memberUserId) {
    return NextResponse.json({ error: 'missing orgId/memberUserId' }, { status: 400 });
  }

  // (optional) check permissions here

  const { error } = await supabase
    .from('org_memberships')
    .delete()
    .eq('org_id', orgId)
    .eq('user_id', memberUserId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
