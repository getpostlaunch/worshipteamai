import { redirect, notFound } from "next/navigation";
import { createServerSupabase } from "@/utils/supabase/server";
import SelectedSongPlayer from "@/components/SelectedSongPlayer";

export const dynamic = "force-dynamic";

type Params = { orgSlug: string; songId: string };

export default async function OrgPracticePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { orgSlug, songId } = await params; // ✅ Next 15: await params
  const supabase = await createServerSupabase(); // ✅ @supabase/ssr helper

  // Auth
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) redirect("/login");

  // slug -> org
  const { data: org, error: orgErr } = await supabase
    .from("orgs")
    .select("id, slug")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (orgErr || !org) notFound();

  // Ensure user is a member of this org
  const { data: mem } = await supabase
    .from("org_memberships")
    .select("id")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .is("removed_at", null)
    .maybeSingle();
  if (!mem) redirect("/app/orgs");

  // (Optional) Ensure the song belongs to this org
  // const { data: song } = await supabase
  //   .from("songs")
  //   .select("id")
  //   .eq("id", songId)
  //   .eq("org_id", org.id)
  //   .maybeSingle();
  // if (!song) notFound();

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6">
      <SelectedSongPlayer id={songId} />
    </div>
  );
}
