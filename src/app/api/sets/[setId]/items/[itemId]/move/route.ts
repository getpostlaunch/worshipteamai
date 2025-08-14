import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/utils/supabase/server';

export async function POST(
  req: Request,
  { params }: { params: { setId: string; itemId: string } }
) {
  const supabase = await createServerSupabase();

  // Auth
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Body
  let direction: 'up' | 'down' | '' = '';
  try {
    const body = await req.json();
    direction = (body?.direction || '').trim();
  } catch {}
  if (direction !== 'up' && direction !== 'down') {
    return NextResponse.json({ error: 'direction must be "up" or "down"' }, { status: 400 });
  }

  // Load items in this set ordered by sort_index
  const { data: items, error: loadErr } = await supabase
    .from('set_items')
    .select('id, sort_index')
    .eq('set_id', params.setId)
    .order('sort_index', { ascending: true });

  if (loadErr) {
    return NextResponse.json({ error: loadErr.message }, { status: 400 });
  }
  const list = items ?? [];
  const idx = list.findIndex((i: any) => i.id === params.itemId);
  if (idx === -1) {
    return NextResponse.json({ error: 'item not found' }, { status: 404 });
  }

  const swapWith = direction === 'up' ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= list.length) {
    // nothing to do (already at boundary)
    return NextResponse.json({ ok: true });
  }

  const a = list[idx];
  const b = list[swapWith];

  // Swap via RPC
  const { error: rpcErr } = await supabase.rpc('swap_set_item_order', {
    a_id: a.id,
    a_idx: a.sort_index,
    b_id: b.id,
    b_idx: b.sort_index,
  });

  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
