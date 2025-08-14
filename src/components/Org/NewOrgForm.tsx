'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase as createBrowserSupabase } from '@/utils/supabaseClient';
import { nanoid } from 'nanoid';

type Availability = 'idle' | 'checking' | 'available' | 'unavailable' | 'invalid';

export default function NewOrgForm() {
  const router = useRouter();
  const supabase = createBrowserSupabase();

  const [submitting, setSubmitting] = useState(false);

  // Fields
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateTxt, setStateTxt] = useState('');
  const [postal, setPostal] = useState('');

  // Username (slug)
  const [username, setUsername] = useState('');
  const [availability, setAvailability] = useState<Availability>('idle');
  const [availabilityMsg, setAvailabilityMsg] = useState<string | null>(null);

  // Logo
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Cover (drag/drop)
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string>('/assets/images/org-default-cover.jpg');

  const usernamePreview = useMemo(
    () => (username ? `/orgs/${username}` : '/orgs/username'),
    [username]
  );

  // --- Helpers ---
  const sanitizeUsername = (raw: string) =>
    raw.toLowerCase().replace(/[^a-z]/g, '').slice(0, 12);

  const isUsernameValid = (u: string) => /^[a-z]{1,12}$/.test(u);

  async function uploadToBucket(bucket: 'org-logos' | 'org-covers', file: File) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const path = `${user.id}/${nanoid()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (upErr) throw upErr;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl as string;
  }

  // --- Username availability (debounced) ---
  useEffect(() => {
    const u = username.trim();
    if (!u) {
      setAvailability('idle');
      setAvailabilityMsg(null);
      return;
    }
    if (!isUsernameValid(u)) {
      setAvailability('invalid');
      setAvailabilityMsg('Use 1–12 lowercase letters (a–z) only.');
      return;
    }

    let active = true;
    setAvailability('checking');
    setAvailabilityMsg('Checking…');

    const t = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('orgs')
          .select('id')
          .eq('slug', u)
          .maybeSingle();

        if (!active) return;

        if (error) {
          setAvailability('idle');
          setAvailabilityMsg('Could not check. Try again.');
          return;
        }

        if (data?.id) {
          setAvailability('unavailable');
          setAvailabilityMsg('That username is taken.');
        } else {
          setAvailability('available');
          setAvailabilityMsg('Available ✓');
        }
      } catch {
        if (!active) return;
        setAvailability('idle');
        setAvailabilityMsg('Could not check. Try again.');
      }
    }, 450);

    return () => {
      active = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const canSubmit =
    !!name.trim() &&
    isUsernameValid(username) &&
    availability === 'available' &&
    !logoUploading &&
    !coverUploading &&
    !submitting;

  // --- Handlers ---
  const onPickLogo = () => logoInputRef.current?.click();
  const onPickCover = () => coverInputRef.current?.click();

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setLogoFile(f);
    if (!f) return;

    try {
      setLogoUploading(true);
      const url = await uploadToBucket('org-logos', f);
      setLogoUrl(url);
    } catch (err: any) {
      alert(err.message || 'Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleCoverChange = async (file: File | null) => {
    setCoverFile(file);
    if (!file) return;
    try {
      setCoverUploading(true);
      const url = await uploadToBucket('org-covers', file);
      setCoverUrl(url);
    } catch (err: any) {
      alert(err.message || 'Failed to upload cover');
    } finally {
      setCoverUploading(false);
    }
  };

  const handleCoverDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] || null;
    if (f) await handleCoverChange(f);
  };

  // --- Submit ---
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      // NOTE: Your existing /api/orgs may generate slug server-side.
      // This will pass `slug` and `cover_url`; update the API to accept them when ready.
      const res = await fetch('/api/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: username, // username as slug
          street: street.trim() || null,
          city: city.trim() || null,
          state: stateTxt.trim() || null,
          postal_code: postal.trim() || null,
          logo_url: logoUrl || null,
          cover_url: coverUrl || null,
        }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Could not create church');

      // If your API returns the slug, use it; otherwise, fall back to username
      const finalSlug = j.slug || username;
      router.push(`/app/orgs/${finalSlug}`);
    } catch (err: any) {
      alert(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      {/* Cover */}
      <section className="space-y-2">
        <label className="text-sm text-slate-300">Cover image</label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleCoverDrop}
          className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/40"
        >
          {/* Fixed/clamped height preview */}
          <div className="relative w-full h-[clamp(160px,28vh,320px)]">
            <img
              src={coverUrl}
              alt="Cover preview"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-800 p-3">
            <div className="text-xs text-slate-400">
              Drag & drop an image here, or
              <button
                type="button"
                onClick={onPickCover}
                className="ml-1 underline decoration-slate-500 hover:decoration-slate-300"
              >
                browse
              </button>
              . Suggested 1280×720.
            </div>
            <div className="text-xs text-slate-500">
              {coverUploading ? 'Uploading…' : 'PNG/JPG/WebP'}
            </div>
          </div>

          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleCoverChange(e.target.files?.[0] || null)}
            className="hidden"
          />
        </div>
      </section>


      {/* Name */}
      <section className="space-y-2">
        <label className="block text-sm text-slate-300">Church name</label>
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Grace Fellowship"
          className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-white"
          required
        />
      </section>

      {/* Username */}
      <section className="space-y-1">
        <label className="block text-sm text-slate-300">Church username</label>

        {/* prevent stretch + keep 50/50 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-start">
          {/* Left: input + availability */}
          <div>
            <input
              name="username"
              value={username}
              onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
              placeholder="e.g., riverstone"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-white"
              maxLength={12}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              required
            />
            <div className="mt-1 text-xs">
              {availability === 'available' && (
                <span className="text-green-400">{availabilityMsg}</span>
              )}
              {availability === 'unavailable' && (
                <span className="text-red-400">{availabilityMsg}</span>
              )}
              {availability === 'invalid' && (
                <span className="text-amber-400">{availabilityMsg}</span>
              )}
              {availability === 'checking' && (
                <span className="text-slate-400">{availabilityMsg}</span>
              )}
            </div>
          </div>

          {/* Right: preview (fixed height, won’t grow) */}
          <div className="self-start h-12 rounded-xl border border-slate-700 bg-slate-900/60 px-4 flex items-center justify-between">
            <span className="text-xs text-slate-400 mr-3">Preview</span>
            <span className="font-mono text-sm text-slate-200 truncate">{usernamePreview}</span>
          </div>
        </div>
      </section>



      {/* Address */}
      <section className="grid gap-3 md:grid-cols-2">
        <input
          name="street"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          placeholder="Street address"
          className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-white"
        />
        <input
          name="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
          className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-white"
        />
        <input
          name="state"
          value={stateTxt}
          onChange={(e) => setStateTxt(e.target.value)}
          placeholder="State"
          className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-white"
        />
        <input
          name="postal_code"
          value={postal}
          onChange={(e) => setPostal(e.target.value)}
          placeholder="ZIP / Postal code"
          className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-white"
        />
      </section>

      {/* Logo */}
      <section className="space-y-2">
        <label className="block text-sm text-slate-300">Logo (optional)</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPickLogo}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            {logoUploading ? 'Uploading…' : 'Choose file'}
          </button>
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Logo preview"
              className="h-10 w-10 rounded bg-white object-contain p-1"
            />
          )}
        </div>
        <input
          ref={logoInputRef}
          type="file"
          name="logo"
          accept="image/*"
          onChange={handleLogoChange}
          className="hidden"
        />
      </section>

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-xl bg-brand-1 px-4 py-2 text-white hover:bg-brand-2 disabled:opacity-50"
        title={
          canSubmit ? 'Create' : 'Fill required fields and resolve username check'
        }
      >
        {submitting ? 'Creating…' : 'Create'}
      </button>
    </form>
  );
}
