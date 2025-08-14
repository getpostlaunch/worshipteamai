import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: Request, { params }: { params: { setId: string } }) {
  const { setId } = params;
  const { song_id } = await req.json();

  const supabase = createRouteHandlerClient({ cookies: async () => cookies() });

  // find current max sort
  const { data: existing = [] } = await supabase
    .from("set_items")
    .select("sort_index")
    .eq("set_id", setId)
    .order("sort_index", { ascending: false })
    .limit(1);

  const nextIndex = (existing[0]?.sort_index ?? -1) + 1;

  const { data, error } = await supabase
    .from("set_items")
    .insert({ set_id: setId, song_id, sort_index: nextIndex })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data!.id });
}
