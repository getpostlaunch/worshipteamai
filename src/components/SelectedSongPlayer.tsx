'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { getSignedSongUrl } from '@/utils/storage';
import AudioPractice from '@/components/AudioPractice';
import type { Song } from '@/types';

type Props = { id: string };

export default function SelectedSongPlayer({ id }: Props) {
  const [song, setSong] = useState<Song | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setMsg('');

      const client = supabase();

      // 1) Load song row
      const { data, error } = await client.from('songs').select('*').eq('id', id).single();
      if (!mounted) return;

      if (error || !data) {
        setMsg(error?.message || 'Song not found.');
        setSong(null);
        setSrc(null);
        setLoading(false);
        return;
      }

      setSong(data as Song);

      // 2) External links need no signing
      if (data.status === 'external') {
        setSrc(data.file_path);
        setLoading(false);
        return;
      }

      // 3) Try signing the stored key
      const trySign = async (key: string) => {
        const signed = await getSignedSongUrl(key, 3600);
        if (!signed.ok) return { ok: false as const, error: signed.error || 'Sign failed' };
        return { ok: true as const, url: signed.url! };
      };

      // Attempt with current DB key
      let result = await trySign(data.file_path);

      // 4) Fallback: if it fails, try an "underscored" variant (handles legacy rows with spaces)
      if (!result.ok) {
        const underscoredKey = data.file_path.replace(/\s+/g, '_');
        if (underscoredKey !== data.file_path) {
          const alt = await trySign(underscoredKey);
          if (alt.ok) {
            // Update DB to the working key so future loads are clean
            await client.from('songs').update({ file_path: underscoredKey }).eq('id', id);
            result = alt;
          }
        }
      }

      if (!mounted) return;

      if (!result.ok) {
        setMsg('Could not get playback URL (object not found).');
        setSrc(null);
        setLoading(false);
        return;
      }

      setSrc(result.url);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  // Utility to refresh token manually if it ever expires during a long session
  const refreshUrl = async () => {
    if (!song || song.status === 'external') return;
    setMsg('');
    const fresh = await getSignedSongUrl(song.file_path, 3600);
    if (!fresh.ok) {
      setMsg(fresh.error || 'Could not refresh URL.');
      return;
    }
    setSrc(fresh.url!);
  };

  if (loading) return <p>Loading…</p>;
  if (msg) {
    return (
      <div>
        <p style={{ color: 'crimson' }}>{msg}</p>
        {song && song.status !== 'external' && (
          <button onClick={refreshUrl} style={{ marginTop: 8, padding: '6px 10px' }}>
            Refresh link
          </button>
        )}
      </div>
    );
  }
  if (!song || !src) return <p>Nothing to play.</p>;

  return (
    <div>
      <h1 className="text-gray-100 text-xl font-semibold">{song.title || 'Player'}</h1>
      {/* Practice is the canonical view */}
      <AudioPractice src={src} songId={song.id} />
    </div>
  );
}
