import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/utils/supabase/server';

export async function POST(
  _req: Request,
  { params }: { params: { orgId: string; memberUserId: string } }
) {
  const supabase = await createServerSupabase();

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // (optional) verify current user has permission

  const { error } = await supabase
    .from('org_memberships')
    .delete()
    .eq('org_id', params.orgId)
    .eq('user_id', params.memberUserId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
