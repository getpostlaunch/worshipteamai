import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createServerSupabase } from "@/utils/supabase/server";
import SidebarDeleteButton from "@/components/Org/SidebarDeleteButton";
import MobileOrgSidebar from "@/components/Org/MobileOrgSidebar"; // <- put the drawer here

export const dynamic = "force-dynamic";

type Params = { orgSlug: string };

export default async function OrgWithSidebarLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<Params>;
}) {
  const { orgSlug } = await params;
  const supabase = await createServerSupabase();

  // Auth
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) redirect("/login");

  // Org by slug (include logo_url for sidebar + mobile drawer)
  const { data: org, error: orgErr } = await supabase
    .from("orgs")
    .select("id, slug, name, logo_url")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (orgErr || !org) notFound();

  // Membership + role
  const { data: me } = await supabase
    .from("org_memberships")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .is("removed_at", null)
    .maybeSingle();
  if (!me) redirect("/app/orgs");

  const myRole = (me.role ?? "member") as "owner" | "leader" | "member";
  const canManage = myRole === "owner" || myRole === "leader";
  const isOwner = myRole === "owner";

  return (
    <div className="min-h-screen bg-brand-3 text-white">
      <div className="mx-auto flex max-w-screen-2xl">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 border-r border-slate-800 bg-slate-950/60 p-4 backdrop-blur supports-[backdrop-filter]:bg-slate-950/40 md:block">
          <div className="mb-4 space-y-3">
            {org.logo_url ? (
              <img
                src={org.logo_url}
                alt=""
                className="h-12 w-12 rounded bg-white object-contain p-1"
              />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded bg-slate-800 text-sm font-semibold">
                {org.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Organization
              </div>
              <div className="truncate text-lg font-semibold text-white">
                {org.name}
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            <SidebarLink href={`/app/orgs/${org.slug}`}>Overview</SidebarLink>
            <SidebarLink href={`/app/orgs/${org.slug}/sets`}>Manage setlists</SidebarLink>
            <SidebarLink href={`/app/orgs/${org.slug}/songs`}>Manage songs</SidebarLink>
            <SidebarLink href={`/app/orgs/${org.slug}/team`}>Team / Invite</SidebarLink>
            <SidebarLink
              href={`/app/orgs/${org.slug}/settings`}
              disabled={!canManage}
              title={canManage ? undefined : "Owners/Leaders only"}
            >
              Edit org
            </SidebarLink>

            <SidebarDeleteButton orgId={org.id} isOwner={isOwner} className="mt-3" />
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/70 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
            <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3">
              {/* Mobile: menu trigger + label */}
              <div className="flex items-center gap-3 md:hidden">
                <MobileOrgSidebar
  org={{
    id: org.id,
    name: org.name,
    slug: org.slug,
    logo_url: org.logo_url ?? null,
  }}
  canManage={canManage}
  isOwner={isOwner}
/>
                <div className="truncate text-sm text-slate-300">{org.name}</div>
              </div>
              <div className="text-sm text-slate-300" />
            </div>
          </header>

          <main className="mx-auto max-w-screen-2xl p-4">{children}</main>
        </div>
      </div>
    </div>
  );
}

/* ---------- Small helpers ---------- */

function SidebarLink({
  href,
  children,
  disabled,
  title,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  const base = "block rounded-lg px-3 py-2 text-sm transition";
  const enabled = "text-slate-200 hover:bg-slate-800";
  const off = "text-slate-500 cursor-not-allowed";
  if (disabled) {
    return (
      <span className={`${base} ${off} ${className}`} title={title}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={`${base} ${enabled} ${className}`} title={title}>
      {children}
    </Link>
  );
}
