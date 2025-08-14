import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(
  req: Request,
  { params }: { params: { orgId: string } }
) {
  const { orgId } = params;
  const { title } = await req.json();

  const supabase = createRouteHandlerClient({ cookies: async () => cookies() });
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Create row (RLS ensures only owner/leader can insert org songs)
  const { data, error } = await supabase
    .from("songs")
    .insert({
      org_id: orgId,
      user_id: user.id,
      uploaded_by: user.id,
      title: title || null,
      status: "pending",
      visibility: "org",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const songId = data!.id as string;
  const ext = "mp3"; // client upload can be any; path is generic
  const uploadPath = `orgs/${orgId}/${songId}/original.${ext}`;

  return NextResponse.json({ ok: true, songId, uploadPath });
}
