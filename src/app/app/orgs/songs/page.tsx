import { redirect, notFound } from "next/navigation";
import { createServerSupabase } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type Params = { orgId: string };

type SongRow = {
  id: string;
  title: string | null;
  status: string | null;
  created_at: string;
  uploaded_by: string | null;
};

export default async function OrgSongsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { orgId } = await params; // ✅ Next 15: await params
  const supabase = await createServerSupabase();

  // Auth
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) redirect("/login");

  // Org by id
  const { data: org, error: orgErr } = await supabase
    .from("orgs")
    .select("id, name")
    .eq("id", orgId)
    .maybeSingle();
  if (orgErr || !org) notFound();

  // My role (controls uploader visibility)
  const { data: myMem } = await supabase
    .from("org_memberships")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .is("removed_at", null)
    .maybeSingle();
  if (!myMem) redirect("/app/orgs");

  const myRole = (myMem.role ?? "member") as "owner" | "leader" | "member";
  const canManage = myRole === "owner" || myRole === "leader";

  // Songs in this org
  const { data: songsRaw } = await supabase
    .from("songs")
    .select("id, title, status, created_at, uploaded_by")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  const songs: SongRow[] =
    songsRaw?.map((s) => ({ ...s, created_at: String(s.created_at) })) ?? [];

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{org.name} — Songs</h1>
          <p className="text-sm text-slate-400">Org library shared with the whole team.</p>
        </div>
        {canManage && (
          <UploadOrgSong orgId={orgId} />
        )}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
        <table className="w-full text-left">
          <thead className="border-b border-slate-800 text-slate-300">
            <tr>
              <th className="px-4 py-3 text-sm font-medium">Title</th>
              <th className="px-4 py-3 text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-sm font-medium">Uploaded</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {songs.map((s) => (
              <tr key={s.id} className="hover:bg-slate-800/30">
                <td className="px-4 py-3 text-white">{s.title || "Untitled"}</td>
                <td className="px-4 py-3 text-slate-300">{s.status || "—"}</td>
                <td className="px-4 py-3 text-slate-400">
                  {new Date(s.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {songs.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-sm text-slate-400">
                  No songs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

// Keep the import at the bottom to avoid hoist issues in some setups
import UploadOrgSong from "@/components/Songs/UploadOrgSong";
