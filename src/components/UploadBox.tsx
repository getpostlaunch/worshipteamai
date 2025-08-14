'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabaseClient';
import FileLoader from '@/components/FileLoader';

export default function UploadBox() {
  const [msg, setMsg] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const onSelect = async (file: File | null, urlFromInput?: string) => {
    setMsg('');
    setBusy(true);
    const client = supabase();

    // Ensure user
    const { data: auth } = await client.auth.getUser();
    const user = auth.user;
    if (!user) {
      setMsg('Please sign in to upload.');
      setBusy(false);
      return;
    }

    try {
      if (file) {
        // Upload file to storage bucket "songs"
        const safeName = file.name.replace(/\s+/g, '_');
        const objectPath = `${user.id}/${Date.now()}-${safeName}`;

        const { error: upErr } = await client.storage.from('songs').upload(objectPath, file, {
          cacheControl: '3600',
          upsert: false,
        });
        if (upErr) throw upErr;

        // Insert DB row
        const { data: inserted, error: insErr } = await client
          .from('songs')
          .insert({
            user_id: user.id,
            title: safeName.replace(/\.[^/.]+$/, ''), // filename (no ext)
            file_path: objectPath, // storage key, not URL
            status: 'uploaded',
          })
          .select()
          .single();
        if (insErr) throw insErr;

        // Go to the new song page
        router.push(`/app/${inserted.id}`);
        return;
      }

      // URL path (external). We'll play direct without signing.
      const url = (urlFromInput || '').trim();
      if (url) {
        const filename = url.split('/').pop() || 'External audio';
        const title = decodeURIComponent(filename).replace(/\.[^/.]+$/, '');

        const { data: inserted, error: insErr } = await client
          .from('songs')
          .insert({
            user_id: user.id,
            title,
            file_path: url,     // store the URL directly
            status: 'external', // flag so player skips signing
          })
          .select()
          .single();
        if (insErr) throw insErr;

        router.push(`/app/${inserted.id}`);
        return;
      }

      setMsg('Please choose a file or paste a URL.');
    } catch (e: any) {
      setMsg(e?.message || 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl bg-neutral-800 p-8">
      <h2 className="text-base text-gray-300 font-semibold mb-2">Upload or paste a URL</h2>
      <FileLoader onSelect={onSelect} />
      {busy && <p className="text-sm text-gray-500 mt-2">Uploading…</p>}
      {msg && <p className="text-sm text-red-600 mt-2">{msg}</p>}
    </div>
  );
}
