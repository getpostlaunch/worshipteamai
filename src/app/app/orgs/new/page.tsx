import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/utils/supabase/server';
import NewOrgForm from '@/components/Org/NewOrgForm';

export default async function NewOrgPage() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/app/orgs/new');

  return (
    <div className="mx-auto max-w-[720px] px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-white">Create church</h1>
      <NewOrgForm />
    </div>
  );
}
