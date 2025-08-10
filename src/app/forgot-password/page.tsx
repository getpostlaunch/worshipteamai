'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string>('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    const { error } = await supabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setMsg(error ? error.message : 'Email sent (if that address exists). Check your inbox.');
  };

  return (
    <div style={{ maxWidth: 420 }}>
      <h1>Forgot password</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <input type="email" placeholder="Your email" value={email} onChange={(e)=>setEmail(e.target.value)} required style={{ padding: 8, border: '1px solid #ccc' }} />
        <button type="submit" style={{ padding: '10px 12px' }}>Send reset link</button>
      </form>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  );
}
