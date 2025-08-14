// src/components/HeaderServer.tsx
import Header from './Header';
import { cookies } from 'next/headers';
import { createServerSupabase } from '@/utils/supabase/server';

export default async function HeaderServer() {
  // Pass the cookies() function directly to the helper (no manual get/await needed)
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let headerUser: { name: string; email: string; avatarUrl?: string | null } | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();

    headerUser = {
      name: profile?.full_name ?? user.email?.split('@')[0] ?? 'User',
      email: user.email ?? '',
      avatarUrl: profile?.avatar_url ?? null,
    };
  }

  return <Header user={headerUser} />;
}
