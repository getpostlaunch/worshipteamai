// app/app/orgs/(with-sidebar)/[orgSlug]/settings/page.tsx
import { redirect, notFound } from 'next/navigation';
import { createServerSupabase } from '@/utils/supabase/server';
import OrgSettingsForm from '@/components/Org/OrgSettingsForm';

export const dynamic = 'force-dynamic';

type Params = { orgSlug: string };

export default async function OrgSettingsPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { orgSlug } = await params; // Next 15
  const supabase = await createServerSupabase();

  // Auth
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) redirect('/login');

  // Org
  const { data: org, error: orgErr } = await supabase
    .from('orgs')
    .select(
      'id, slug, name, street, city, state, postal_code, logo_url, cover_url'
    )
    .eq('slug', orgSlug)
    .maybeSingle();

  if (orgErr) notFound();
  if (!org) notFound();

  // Require owner/leader
  const { data: me } = await supabase
    .from('org_memberships')
    .select('role')
    .eq('org_id', org.id)
    .eq('user_id', user.id)
    .is('removed_at', null)
    .maybeSingle();

  const canManage = me && ['owner', 'leader'].includes(me.role || '');
  if (!canManage) redirect(`/app/orgs/${org.slug}`);

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-white">
        Edit organization
      </h1>

      <OrgSettingsForm
        orgId={org.id}
        orgSlug={org.slug}
        initial={{
          name: org.name ?? '',
          street: org.street ?? '',
          city: org.city ?? '',
          state: org.state ?? '',
          postal_code: org.postal_code ?? '',
          logo_url: org.logo_url ?? '',
          slug: org.slug ?? '',
          cover_url: org.cover_url ?? null, // ok if null/absent
        }}
      />
    </div>
  );
}
