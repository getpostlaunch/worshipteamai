'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';

export const dynamic = 'force-dynamic';

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('redirect') || '/app';

  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    // if already logged in, middleware will redirect on nav; this is just defensive
    (async () => {
      const { data } = await supabase().auth.getSession();
      if (data.session) router.replace('/app');
    })();
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase().auth.signInWithPassword({ email, password: pw });
    if (error) return setMsg(error.message);
    router.replace(redirectTo);
  };

  return (
    <div style={{ maxWidth: 420 }}>
      <h1>Login</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          required
          style={{ padding: 8, border: '1px solid #ccc' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={pw}
          onChange={(e)=>setPw(e.target.value)}
          required
          style={{ padding: 8, border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '10px 12px' }}>Sign in</button>
      </form>
      <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
        <a href="/signup">Create account</a>
        <a href="/forgot-password">Forgot password?</a>
      </div>
      {msg && <p style={{ marginTop: 12, color: 'crimson' }}>{msg}</p>}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
