import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/utils/supabase/server';

export async function DELETE(
  _req: Request,
  { params }: { params: { setId: string; itemId: string } }
) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Optional: check the user has permission to modify this set (org membership/owner).
  // Do that here if needed before deleting.

  const { error } = await supabase
    .from('set_items')
    .delete()
    .eq('id', params.itemId)
    .eq('set_id', params.setId); // ensure the item belongs to this set

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
