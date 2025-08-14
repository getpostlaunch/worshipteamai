import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(
  req: Request,
  { params }: { params: { songId: string } }
) {
  const { songId } = params;
  const { file_path, status, bpm, song_key, title } = await req.json();

  const supabase = createRouteHandlerClient({ cookies: async () => cookies() });
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("songs")
    .update({
      file_path: file_path ?? null,
      status: status ?? "uploaded",
      bpm: bpm ?? null,
      song_key: song_key ?? null,
      title: title ?? undefined,
    })
    .eq("id", songId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
