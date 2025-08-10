'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import type { Song } from '@/types';

type Props = {
  onSelect: (song: Song, signedUrl: string) => void;
};

export default function SongList({ onSelect }: Props) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg('');
      const client = supabase();

      const { data: auth } = await client.auth.getUser();
      if (!auth.user) {
        setMsg('Please sign in.');
        setLoading(false);
        return;
      }

      const { data, error } = await client
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) setMsg(error.message);
      setSongs((data as Song[]) || []);
      setLoading(false);
    })();
  }, []);

  const openSong = async (song: Song) => {
    const client = supabase();
    // create a 1-hour signed URL for playback
    const { data, error } = await client.storage.from('songs').createSignedUrl(song.file_path, 3600);
    if (error || !data?.signedUrl) {
      setMsg(error?.message || 'Could not get signed URL.');
      return;
    }
    onSelect(song, data.signedUrl);
  };

  if (loading) return <p>Loading songs…</p>;
  if (msg) return <p style={{ color: 'crimson' }}>{msg}</p>;
  if (!songs.length) return <p>No songs yet. Upload one below.</p>;

  return (
    <div className="mt-4 p-4 bg-neutral-900 hover:bg-neutral-800 rounded-lg">
      {songs.map((s) => (
        <button
          key={s.id}
          onClick={() => openSong(s)}
          style={{
            cursor: 'pointer',
          }}
        >
          <div>
            <div>
              <p className="text-left font-regular text-gray-300 mb-1">{s.title || s.file_path.split('/').pop()}</p>
              <div className="text-gray-500 text-sm">{new Date(s.created_at).toLocaleString()}</div>
            </div>
            <span>{/* s.status */}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
