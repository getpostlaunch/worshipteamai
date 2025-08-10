'use client';

import { useState } from 'react';
import AudioPractice from '@/components/AudioPractice';
import SongListClient from '@/components/SongListClient';
import UploadBox from '@/components/UploadBox';
import type { Song } from '@/types';

export default function AppHome() {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [msg, setMsg] = useState('');

  const handleSelectFromList = (song: Song, url: string) => {
    setCurrentSong(song);
    setUploadedUrl(url);
    setMsg('');
  };

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '16px' }}>
      {/* 2-column responsive grid: sidebar + main */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 24,
        }}
      >
        {/* On desktop, switch to 320px sidebar + fluid main */}
        <style>{`
          @media (min-width: 768px) {
            .app-grid { grid-template-columns: 320px 1fr; }
            .sticky-col { position: sticky; top: 80px; height: calc(100vh - 96px); overflow: auto; }
          }
        `}</style>

        <div className="app-grid" style={{ display: 'grid', gap: 24 }}>
          {/* Sidebar */}
          <aside className="sticky-col">
            <h2 className="text-gray-300">My Songs</h2>
            <SongListClient />
          </aside>

          {/* Main */}
          <main
            style={{
              display: 'grid',
              gap: 16,
            }}
          >
            {/* Drag & drop uploader */}
            <section>
              <h2 className="text-gray-800">Upload a new song</h2>
              {/* UploadBox handles drag & drop and URL paste.
                 It creates the DB row and then router.push(`/app/{id}`).
                 No props needed. */}
              <UploadBox />
            </section>

            {/* Player shown when selecting from the sidebar list */}
            {uploadedUrl && (
              <section
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 16,
                  padding: 16,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                }}
              >
                <h2 style={{ margin: 0 }}>{currentSong?.title || 'Player'}</h2>
                <div style={{ marginTop: 12 }}>
                  <AudioPractice src={uploadedUrl} />
                </div>
              </section>
            )}

            {msg && (
              <p style={{ color: 'crimson', margin: 0 }}>
                {msg}
              </p>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
