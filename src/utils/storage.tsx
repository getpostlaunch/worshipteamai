'use client';

import { supabase } from '@/utils/supabaseClient';

type UploadResult = { ok: true; path: string } | { ok: false; error: string };
type SignedResult = { ok: true; url: string } | { ok: false; error: string };

const PROVIDER = (process.env.NEXT_PUBLIC_STORAGE_PROVIDER || 'supabase').toLowerCase();
const SONGS_BUCKET = process.env.NEXT_PUBLIC_SONGS_BUCKET || 'songs';

/** Cloudinary (optional) */
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET; // use an unsigned preset

/** Helper: detect if path is already a fully-qualified URL */
const isUrl = (s: string) => /^https?:\/\//i.test(s);

/**
 * Upload a song file and return a storage "path".
 * - supabase: returns bucket path like "user_<uid>/timestamp_filename.mp3"
 * - cloudinary: returns the final https URL (secure_url)
 */
export async function uploadSong(userId: string, file: File): Promise<UploadResult> {
  if (PROVIDER === 'cloudinary') {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      return { ok: false, error: 'Cloudinary env vars missing (CLOUD_NAME / UPLOAD_PRESET).' };
    }

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('upload_preset', UPLOAD_PRESET);
      // Optional: organize under a folder by user
      form.append('folder', `worshipteamai/user_${userId}`);

      const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
        method: 'POST',
        body: form,
      });

      if (!resp.ok) {
        const txt = await resp.text();
        return { ok: false, error: `Cloudinary upload failed: ${resp.status} ${txt}` };
      }

      const json = await resp.json();
      // json.secure_url is a permanent HTTPS URL you can play directly
      return { ok: true, path: json.secure_url as string };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Cloudinary upload error' };
    }
  }

  // ===== Supabase (default) =====
  const client = supabase();
  const path = `user_${userId}/${Date.now()}_${file.name}`;
  const { error } = await client.storage.from(SONGS_BUCKET).upload(path, file, { upsert: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, path };
}

/**
 * Get a playable URL for a stored path.
 * - supabase: creates a signed URL for private bucket
 * - cloudinary: the "path" is already a URL → just return it
 */
export async function getSignedSongUrl(path: string, expires = 3600): Promise<SignedResult> {
  // Cloudinary or any direct URL: no signing needed
  if (PROVIDER === 'cloudinary' || isUrl(path)) {
    return { ok: true, url: path };
  }

  const client = supabase();
  const { data, error } = await client.storage.from(SONGS_BUCKET).createSignedUrl(path, expires);
  if (error || !data?.signedUrl) return { ok: false, error: error?.message || 'No signed URL' };
  return { ok: true, url: data.signedUrl };
}
