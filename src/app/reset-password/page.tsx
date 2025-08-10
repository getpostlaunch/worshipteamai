'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState<string>('');
  const [ready, setReady] = useState(false);

  // On this page, Supabase sends the user back with a session in the URL.
  // We wait one tick for Supabase to initialize that session client-side.
  useEffect(() => {
    (async () => {
      await supabase().auth.getSession(); // ensures the URL session is applied
      setReady(true);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    const { data, error } = await supabase().auth.updateUser({ password: pw });
    if (error) return setMsg(error.message);
    setMsg('Password updated. Redirecting to login...');
    setTimeout(() => router.replace('/login'), 1200);
  };

  return (
    <div style={{ maxWidth: 420 }}>
      <h1>Set a new password</h1>
      {!ready ? (
        <p>Loading...</p>
      ) : (
        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <input
            type="password"
            placeholder="New password"
            value={pw}
            onChange={(e)=>setPw(e.target.value)}
            required
            style={{ padding: 8, border: '1px solid #ccc' }}
          />
          <button type="submit" style={{ padding: '10px 12px' }}>Update password</button>
        </form>
      )}
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  );
}
