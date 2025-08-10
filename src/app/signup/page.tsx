'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [username, setUsername] = useState(''); // optional; will be lowercased
  const [msg, setMsg] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);

    const cleanUsername = username ? username.trim().toLowerCase() : undefined;

    // Pass first/last/username into user metadata so our DB trigger can read them
    const { error } = await supabase().auth.signUp({
      email,
      password: pw,
      options: {
        data: {
          first_name: first,
          last_name: last,
          username: cleanUsername,
        },
        // after email confirm, send user into app (adjust if you want)
        emailRedirectTo: `${window.location.origin}/app`,
      },
    });

    setLoading(false);
    setMsg(error ? error.message : 'Check your email to confirm your account, then log in.');
  };

  return (
    <div style={{ maxWidth: 480 }}>
      <h1>Create account</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input
            placeholder="First name"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            required
            style={{ padding: 8, border: '1px solid #ccc' }}
          />
          <input
            placeholder="Last name"
            value={last}
            onChange={(e) => setLast(e.target.value)}
            required
            style={{ padding: 8, border: '1px solid #ccc' }}
          />
        </div>

        <input
          placeholder="Username (optional, lowercase)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: 8, border: '1px solid #ccc' }}
        />

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

        <button type="submit" disabled={loading} style={{ padding: '10px 12px' }}>
          {loading ? 'Creating…' : 'Sign up'}
        </button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
      <p style={{ marginTop: 8 }}>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </div>
  );
}
