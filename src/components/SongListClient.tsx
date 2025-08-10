'use client';

import { useRouter } from 'next/navigation';
import SongList from './SongList';
import type { Song } from '@/types';

export default function SongListClient() {
  const router = useRouter();

  // Ignore the signedUrl; just navigate to /app/{id}
  const onSelect = (song: Song /*, _signedUrl: string */) => {
    router.push(`/app/${song.id}`);
  };

  // SongList expects onSelect: (song, signedUrl) => void
  // We'll pass a function with two params but ignore the second.
  return <SongList onSelect={onSelect as unknown as (s: Song, u: string) => void} />;
}
