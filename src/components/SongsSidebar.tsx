// Server Component: simple mocked list for now.
// We'll swap this to Supabase in the next step.

type Song = {
  id: string;
  title: string;
  artist?: string;
  key?: string;
  bpm?: number;
};

const MOCK_SONGS: Song[] = [
  { id: '1', title: 'Gratitude', artist: 'Brandon Lake', key: 'B', bpm: 76 },
  { id: '2', title: 'Firm Foundation (He Won’t)', artist: 'MSS', key: 'D', bpm: 72 },
  { id: '3', title: 'Promises', artist: 'Maverick City', key: 'G', bpm: 72 },
  { id: '4', title: 'Goodness of God', artist: 'Bethel', key: 'A', bpm: 63 },
  { id: '5', title: 'What A Beautiful Name', artist: 'Hillsong', key: 'D', bpm: 68 },
];

export default async function SongsSidebar() {
  const songs = MOCK_SONGS; // TODO: fetch from DB

  return (
    <div className="p-3">
      <div className="px-2 py-2 border-b border-gray-100">
        <h2 className="text-sm font-semibold tracking-wide">Songs</h2>
      </div>

      <ul className="divide-y divide-gray-100">
        {songs.map((s) => (
          <li key={s.id}>
            <a
              href={`/song/${s.id}`}
              className="block px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
            >
              <div className="text-sm font-medium">{s.title}</div>
              <div className="text-xs text-gray-600">
                {s.artist ?? 'Unknown'} • {s.key ?? '—'} • {s.bpm ? `${s.bpm} BPM` : '—'}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
