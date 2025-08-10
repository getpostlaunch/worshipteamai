'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

export default function AccountPage() {
  const [email, setEmail] = useState('');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      setMsg('');
      const client = supabase();
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) return;

      setEmail(auth.user.email || '');

      const { data, error } = await client.from('profiles').select('*').eq('id', auth.user.id).single();
      if (error) { setMsg(error.message); return; }

      setFirst(data?.first_name || '');
      setLast(data?.last_name || '');
      setUsername(data?.username || '');
      setAvatarUrl(data?.avatar_url || null);
    })();
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    const client = supabase();
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) return;

    // If user picked a new avatar, upload first
    let newAvatarUrl = avatarUrl;
    if (file) {
      const path = `user_${auth.user.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await client.storage.from('avatars').upload(path, file, { upsert: false });
      if (upErr) { setMsg(`Avatar upload error: ${upErr.message}`); return; }
      // Public bucket → public URL available:
      const { data: pub } = client.storage.from('avatars').getPublicUrl(path);
      newAvatarUrl = pub.publicUrl;
    }

    // Update profile
    const { error: updErr } = await client.from('profiles').update({
      first_name: first,
      last_name: last,
      username: username ? username.toLowerCase().trim() : null,
      avatar_url: newAvatarUrl,
    }).eq('id', (await client.auth.getUser()).data.user?.id!);

    if (updErr) { setMsg(updErr.message); return; }

    setAvatarUrl(newAvatarUrl || null);
    setFile(null);
    setMsg('Profile saved.');
  };

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 560 }}>
      <h1>Profile</h1>
      <p style={{ color: '#555' }}>Email (read‑only): <strong>{email}</strong></p>

      <form onSubmit={saveProfile} style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input
            placeholder="First name"
            value={first}
            onChange={(e)=>setFirst(e.target.value)}
            required
            style={{ padding: 8, border: '1px solid #ccc' }}
          />
          <input
            placeholder="Last name"
            value={last}
            onChange={(e)=>setLast(e.target.value)}
            required
            style={{ padding: 8, border: '1px solid #ccc' }}
          />
        </div>

        <input
          placeholder="Username (lowercase, unique)"
          value={username}
          onChange={(e)=>setUsername(e.target.value)}
          style={{ padding: 8, border: '1px solid #ccc' }}
        />

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <img
            src={avatarUrl || 'https://placehold.co/64x64?text=Avatar'}
            alt="Avatar"
            width={64}
            height={64}
            style={{ borderRadius: 8, objectFit: 'cover' }}
          />
          <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0] ?? null)} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" style={{ padding: '8px 12px' }}>Save</button>
        </div>
      </form>

      {msg && <p>{msg}</p>}
    </div>
  );
}
