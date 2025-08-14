import { redirect } from "next/navigation";
import { createServerSupabase } from "@/utils/supabase/server";
import SelectedSongPlayer from "@/components/SelectedSongPlayer";

export const dynamic = "force-dynamic";

type Params = { songId: string };

export default async function PracticePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { songId } = await params; // ✅ Next 15: await params
  const supabase = await createServerSupabase(); // ✅ @supabase/ssr helper

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) redirect("/login");

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6">
      <SelectedSongPlayer id={songId} />
    </div>
  );
}
