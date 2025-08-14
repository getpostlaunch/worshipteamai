import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function DELETE(_req: Request, { params }: { params: { setId: string, itemId: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const { error } = await supabase.from("set_items").delete().eq("id", params.itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
