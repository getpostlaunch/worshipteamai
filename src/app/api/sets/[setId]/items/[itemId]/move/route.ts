import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: Request, { params }: { params: { setId: string, itemId: string } }) {
  const { setId, itemId } = params;
  const { direction } = await req.json(); // "up" | "down"

  const supabase = createRouteHandlerClient({ cookies });

  const { data: items = [] } = await supabase
    .from("set_items").select("id, sort_index").eq("set_id", setId).order("sort_index", { ascending: true });

  const idx = items.findIndex(i => i.id === itemId);
  if (idx === -1) return NextResponse.json({ error: "item not found" }, { status: 404 });

  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= items.length) return NextResponse.json({ ok: true });

  const a = items[idx], b = items[swapWith];

  const { error } = await supabase.rpc("swap_set_item_order", { a_id: a.id, a_idx: a.sort_index, b_id: b.id, b_idx: b.sort_index });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
