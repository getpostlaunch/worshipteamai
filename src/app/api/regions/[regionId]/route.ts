import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function PUT(
  req: Request,
  { params }: { params: { regionId: string } }
) {
  const body = await req.json();
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // RLS: only the owner of the region can update
  const { data, error } = await supabase
    .from("user_song_regions")
    .update({
      label: body.label ?? undefined,
      start_sec: body.start_sec ?? undefined,
      end_sec: body.end_sec ?? undefined,
      loop: body.loop ?? undefined,
      color: body.color ?? undefined,
    })
    .eq("id", params.regionId)
    .select("id,label,start_sec,end_sec,loop,color,created_at,updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, region: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { regionId: string } }
) {
  const supabase = createRouteHandlerClient({ cookies: async () => cookies() });
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("user_song_regions")
    .delete()
    .eq("id", params.regionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
