import { redirect, notFound } from "next/navigation";
import { createServerSupabase } from "@/utils/supabase/server";
import InviteForm from "@/components/Team/InviteForm";

export const dynamic = "force-dynamic";

type Params = { orgSlug: string };

type MemberRow = {
  user_id: string;
  role: "owner" | "leader" | "member";
  joined_at: string;
};

type InviteRow = {
  id: string;
  email: string;
  role: "leader" | "member";
  created_at: string;
  accepted_at: string | null;
  expires_at: string | null;
};

export default async function TeamPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { orgSlug } = await params; // ✅ Next 15: await params
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
    .select("id, name, slug")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (orgErr || !org) notFound();

  // My membership + role
  const { data: me } = await supabase
    .from("org_memberships")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .is("removed_at", null)
    .maybeSingle();
  if (!me) redirect("/app/orgs");

  const myRole = (me.role ?? "member") as MemberRow["role"];
  const canManage = myRole === "owner" || myRole === "leader";

  // Members (RLS will scope rows; owners/leaders see all)
  const { data: membersData } = await supabase
    .from("org_memberships")
    .select("user_id, role, joined_at")
    .eq("org_id", org.id)
    .is("removed_at", null)
    .order("role", { ascending: true })
    .order("joined_at", { ascending: true });
  const members: MemberRow[] = (membersData ?? []) as MemberRow[];

  // Pending invites (accepted_at IS NULL). We include expires_at for later display if you want.
  const { data: invitesData } = await supabase
    .from("org_invitations")
    .select("id, email, role, created_at, accepted_at, expires_at")
    .eq("org_id", org.id)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });
  const invites: InviteRow[] = (invitesData ?? []) as InviteRow[];

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{org.name} — Team</h1>
          <p className="text-sm text-slate-400">Your role: {myRole}</p>
        </div>
        {canManage && <InviteForm orgId={org.id} />}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Members */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40">
          <header className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-lg font-medium text-white">Members</h2>
          </header>
          <ul className="divide-y divide-slate-800">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-white">{m.user_id}</div>
                  <div className="text-xs text-slate-400">
                    role: {m.role} • joined {new Date(m.joined_at).toLocaleDateString()}
                  </div>
                </div>

                {canManage && m.role !== "owner" && (
                  <form
                    action={`/api/orgs/${org.id}/members/${m.user_id}/remove`}
                    method="post"
                  >
                    <button className="rounded-xl border border-red-600/60 px-3 py-1.5 text-sm text-red-400 hover:border-red-500 hover:text-red-300">
                      Remove
                    </button>
                  </form>
                )}
              </li>
            ))}
            {members.length === 0 && (
              <li className="px-4 py-6 text-sm text-slate-400">No members yet.</li>
            )}
          </ul>
        </section>

        {/* Invites */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40">
          <header className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-lg font-medium text-white">Invitations</h2>
          </header>
          <ul className="divide-y divide-slate-800">
            {invites.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-white">{inv.email}</div>
                  <div className="text-xs text-slate-400">
                    role: {inv.role} • pending
                    {inv.expires_at ? ` • expires ${new Date(inv.expires_at).toLocaleDateString()}` : ""}
                  </div>
                </div>
              </li>
            ))}
            {invites.length === 0 && (
              <li className="px-4 py-6 text-sm text-slate-400">No pending invites.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
