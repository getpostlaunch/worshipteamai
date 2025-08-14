import { notFound } from "next/navigation";
import { createServerSupabase } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type Params = { orgSlug: string };

export default async function OrgSetsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { orgSlug } = await params; // ✅ Next 15: await params
  const supabase = await createServerSupabase(); // ✅ SSR helper

  // Auth
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) notFound();

  // slug -> org
  const { data: org, error: orgErr } = await supabase
    .from("orgs")
    .select("id,name,slug")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (orgErr || !org) notFound();

  // membership
  const { data: myMem } = await supabase
    .from("org_memberships")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .is("removed_at", null)
    .maybeSingle();
  const canManage = ["owner", "leader"].includes(myMem?.role ?? "");

  // sets
  const { data: sets } = await supabase
    .from("sets")
    .select("id,name,service_date,created_at")
    .eq("org_id", org.id)
    .order("service_date", { ascending: false })
    .order("created_at", { ascending: false });

  const safeSets =
    sets?.map((s) => ({
      ...s,
      service_date: s.service_date ? String(s.service_date) : null,
    })) ?? [];

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">{org.name} — Setlists</h1>
        {canManage && (
          <form
            action={`/api/orgs/${org.id}/sets`}
            method="post"
            className="flex items-center gap-2"
          >
            <input
              name="name"
              required
              placeholder="Set name"
              className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white"
            />
            <input
              name="service_date"
              type="date"
              className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-white"
            />
            <button className="rounded-xl bg-brand-1 px-3 py-2 text-sm text-white hover:bg-brand-2">
              New set
            </button>
          </form>
        )}
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40">
        <ul className="divide-y divide-slate-800">
          {safeSets.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-4 py-3">
              <div className="text-white">
                <a
                  href={`/app/orgs/${org.slug}/sets/${s.id}`}
                  className="hover:underline"
                >
                  {s.name ?? "Untitled"}
                </a>
                <div className="text-xs text-slate-400">
                  {s.service_date ? new Date(s.service_date).toDateString() : "No date"}
                </div>
              </div>
              <a
                href={`/app/orgs/${org.slug}/sets/${s.id}`}
                className="text-sm text-slate-300 hover:text-white"
              >
                Open →
              </a>
            </li>
          ))}
          {safeSets.length === 0 && (
            <li className="px-4 py-6 text-sm text-slate-400">No sets yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
