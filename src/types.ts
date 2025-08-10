export type Song = {
  id: string;
  user_id: string;
  title: string | null;
  file_path: string;
  status: 'uploaded' | 'processing' | 'ready' | 'failed' | 'external'; // ⬅️ added 'external'
  stems: Record<string, unknown>;
  bpm: number | null;
  song_key: string | null;
  duration_seconds: number | null;
  created_at: string;
};
