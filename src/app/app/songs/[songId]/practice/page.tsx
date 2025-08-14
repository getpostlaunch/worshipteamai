import { redirect, notFound } from "next/navigation";
import { createServerSupabase } from "@/utils/supabase/server";
import PracticeClient from "@/components/Practice/PracticeClient";

export const dynamic = "force-dynamic";

type Params = { songId: string };

export default async function PracticePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { songId } = await params; // ✅ Next 15 requires awaiting params
  const supabase = await createServerSupabase(); // ✅ @supabase/ssr helper

  // Auth
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) redirect("/login");

  // RLS will scope access to only allowed songs
  const { data: song, error: songErr } = await supabase
    .from("songs")
    .select("id, title, file_path")
    .eq("id", songId)
    .maybeSingle();

  if (songErr || !song?.file_path) notFound();

  // Signed URL for audio (1 hour)
  const { data: signed, error: urlErr } = await supabase.storage
    .from("songs")
    .createSignedUrl(song.file_path, 60 * 60);

  if (urlErr || !signed?.signedUrl) notFound();

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold text-white">
        Practice: {song.title || "Untitled"}
      </h1>
      <PracticeClient songId={song.id} audioUrl={signed.signedUrl} />
    </div>
  );
}
