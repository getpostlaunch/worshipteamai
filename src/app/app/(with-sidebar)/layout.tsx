import React from 'react';
import AdminSidebar from '@/components/Layout/AdminSidebar';
import OrgSwitcher from '@/components/OrgSwitcher';
import { redirect } from 'next/navigation';

// NEW: server-side Supabase helper (your ssr helper)
import { createServerSupabase } from '@/utils/supabase/server'; // adjust path if different

export default async function WithSidebarLayout({ children }: { children: React.ReactNode }) {
  // Use the SSR helper (it should internally handle Next 15 cookies)
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ---- Guard: if user has orgs but no selected org, send to chooser ----
  if (user?.id) {
    const { data: memberships, error: mErr } = await supabase
      .from('org_memberships')
      .select('org_id')
      .eq('user_id', user.id)
      .is('removed_at', null);

    if (!mErr) {
      const hasOrgs = (memberships?.length ?? 0) > 0;
      

      const { data: pref } = await supabase
        .from('user_preferences')
        .select('last_selected_org_id')
        .eq('user_id', user.id)
        .maybeSingle();

      const hasPref = !!pref?.last_selected_org_id;

      // (we'll add console.log here next to debug the bounce)
      if (hasOrgs && !hasPref) {
        redirect('/app/orgs');
      }
    }
  }

  // ---- Header context: read selected org (safe, optional) ----
  let orgSlug: string | null = null;
  let orgName: string | null = null;

  if (user?.id) {
    const { data: pref } = await supabase
      .from('user_preferences')
      .select('last_selected_org_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const orgId = pref?.last_selected_org_id ?? null;

    if (orgId) {
      const { data: org } = await supabase
        .from('orgs')
        .select('slug, name')
        .eq('id', orgId)
        .maybeSingle();

      orgSlug = org?.slug ?? null;
      orgName = org?.name ?? null;
    }
  }

  return (
    <div className="min-h-screen bg-brand-3 text-white">
      <div className="flex">
        <AdminSidebar orgSlug={orgSlug} orgName={orgName} userEmail={user?.email ?? null} />
        <div className="flex-1">
          <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/70 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
            <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3">
              <div className="text-sm text-slate-300" />
              <div className="flex items-center gap-3">
                <OrgSwitcher />
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-screen-2xl p-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
