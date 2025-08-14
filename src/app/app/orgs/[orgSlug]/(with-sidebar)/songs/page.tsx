import { redirect, notFound } from "next/navigation";
import { createServerSupabase } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type Params = { orgSlug: string };

export default async function OrgSongsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { orgSlug } = await params; // Next 15: await params
  const supabase = await createServerSupabase();

  // Auth
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) redirect("/login");

  // slug -> org
  const { data: org, error: orgErr } = await supabase
    .from("orgs")
    .select("id, slug, name")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (orgErr || !org) notFound();

  // Ensure membership
  const { data: mem } = await supabase
    .from("org_memberships")
    .select("id")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .is("removed_at", null)
    .maybeSingle();
  if (!mem) redirect("/app/orgs");

  // Songs in this org
  const { data: songs } = await supabase
    .from("songs")
    .select("id, title, created_at, status")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  const items =
    songs?.map((s) => ({
      ...s,
      created_at: String(s.created_at),
    })) ?? [];

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">{org.name} — Songs</h1>
        <a
          href={`/app/orgs/${org.slug}`}
          className="rounded-xl bg-brand-1 px-3 py-2 text-sm text-white hover:bg-brand-2"
        >
          Upload
        </a>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40">
        <ul className="divide-y divide-slate-800">
          {items.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-white">{s.title || "Untitled"}</div>
                <div className="text-xs text-slate-400">
                  {new Date(s.created_at).toLocaleDateString()} • {s.status ?? "—"}
                </div>
              </div>
              <a
                href={`/app/orgs/${org.slug}/practice/${s.id}`}
                className="text-sm text-slate-300 hover:text-white"
              >
                Practice →
              </a>
            </li>
          ))}
          {items.length === 0 && (
            <li className="px-4 py-6 text-sm text-slate-400">No songs yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
