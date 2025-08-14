// Server wrapper that fetches Supabase auth and passes user to Footer
import Footer from './Footer';
import { createServerSupabase } from '@/utils/supabase/server';

export default async function FooterServer() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let footerUser: { name: string; email: string; avatarUrl?: string | null } | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    footerUser = {
      name: profile?.full_name ?? user.email?.split('@')[0] ?? 'User',
      email: user.email ?? '',
      avatarUrl: profile?.avatar_url ?? null,
    };
  }

  return <Footer user={footerUser} />;
}
