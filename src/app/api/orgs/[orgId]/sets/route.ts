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
    .from('setlists')
    .select('id, name, service_date')
    .eq('org_id', params.orgId)
    .order('service_date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
