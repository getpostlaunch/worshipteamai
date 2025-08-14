'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';

type Props = {
  orgId: string;
  orgSlug: string; // keep if you use it for redirects
  initial: {
    slug: string;            // ✅ add this
    name: string;
    street: string;
    city: string;
    state: string;
    postal_code: string;
    logo_url: string;
    cover_url?: string | null; // optional cover (public URL)
  };
};

type Availability =
  | 'idle'
  | 'checking'
  | 'available'
  | 'unavailable'
  | 'invalid';

const sanitizeUsername = (raw: string) =>
  raw.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 12);

export default function OrgSettingsForm({ orgId, orgSlug, initial }: Props) {
  const client = supabase();

  // form state
  const [form, setForm] = useState({
    name: initial.name,
    street: initial.street ?? '',
    city: initial.city ?? '',
    state: initial.state ?? '',
    postal_code: initial.postal_code ?? '',
    logo_url: initial.logo_url ?? '',
    slug: initial.slug ?? '',
    cover_url: initial.cover_url ?? null,
  });

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // logo upload
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const pickLogo = () => logoInputRef.current?.click();

  // cover upload
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const pickCover = () => coverInputRef.current?.click();
  const [coverUploading, setCoverUploading] = useState(false);

  // ---------- Username (slug) availability ----------
  const [availability, setAvailability] = useState<Availability>('idle');
  const [availabilityMsg, setAvailabilityMsg] = useState<string>('');

  const username = form.slug;
  const usernamePreview = useMemo(
    () => `/orgs/${username || 'your-church'}`,
    [username]
  );

  useEffect(() => {
    const u = sanitizeUsername(username);
    if (u !== username) {
      setForm(f => ({ ...f, slug: u }));
      return;
    }

    if (!u) {
      setAvailability('idle');
      setAvailabilityMsg('');
      return;
    }

    // simple validity gate (same rules we enforce when typing)
    if (!/^[a-z0-9-]{1,12}$/.test(u)) {
      setAvailability('invalid');
      setAvailabilityMsg('Use a–z, 0–9, dashes only (max 12).');
      return;
    }

    // Debounce check
    setAvailability('checking');
    setAvailabilityMsg('Checking availability…');

    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/orgs/check-username?username=${encodeURIComponent(u)}&excludeId=${encodeURIComponent(
            orgId
          )}`
        );
        if (!res.ok) throw new Error('check failed');
        const j = (await res.json()) as { available: boolean; message?: string };
        if (j.available) {
          setAvailability('available');
          setAvailabilityMsg('Available ✓');
        } else {
          setAvailability('unavailable');
          setAvailabilityMsg(j.message || 'Taken');
        }
      } catch {
        // If the endpoint isn’t present, just don’t block the user
        setAvailability('idle');
        setAvailabilityMsg('');
      }
    }, 350);

    return () => clearTimeout(t);
  }, [username, orgId]);

  // ---------- Upload handlers ----------
  const onLogoChange = async (f: File | null) => {
    if (!f) return;
    setBusy(true);
    setMsg(null);

    const ext = (f.name.split('.').pop() || 'png').toLowerCase();
    const path = `${orgId}/${Date.now()}.${ext}`;

    const up = await client.storage.from('org-logos').upload(path, f, {
      upsert: true,
      cacheControl: '3600',
    });
    if (up.error) {
      setBusy(false);
      setMsg(up.error.message);
      return;
    }
    const { data } = client.storage.from('org-logos').getPublicUrl(path);
    setForm(p => ({ ...p, logo_url: data.publicUrl }));
    setBusy(false);
  };

  const handleCoverFile = async (f: File | null) => {
    if (!f) return;
    setCoverUploading(true);
    setMsg(null);

    const ext = (f.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${orgId}/${Date.now()}.${ext}`;

    const up = await client.storage.from('org-covers').upload(path, f, {
      upsert: true,
      cacheControl: '3600',
    });
    if (up.error) {
      setCoverUploading(false);
      setMsg(up.error.message);
      return;
    }
    const { data } = client.storage.from('org-covers').getPublicUrl(path);
    setForm(p => ({ ...p, cover_url: data.publicUrl }));
    setCoverUploading(false);
  };

  const handleCoverDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] || null;
    handleCoverFile(f);
  };

  // ---------- Submit ----------
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/orgs/${orgId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          street: form.street.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          postal_code: form.postal_code.trim() || null,
          logo_url: form.logo_url || null,
          slug: form.slug.trim(),        // <-- username/slug
          cover_url: form.cover_url || null,
        }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'Failed to save');

      setMsg('Saved');
      // optional: if slug changed, navigate:
      // if (form.slug && form.slug !== orgSlug) window.location.href = `/app/orgs/${form.slug}`;
    } catch (err: any) {
      setMsg(err.message || 'Failed to save');
    } finally {
      setBusy(false);
    }
  };

  // ---------- UI ----------
  const coverUrl =
    form.cover_url || '/assets/images/org-default-cover.jpg';

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Name / Address */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm text-slate-300">Name</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-white placeholder:text-slate-500 focus:border-white"
          />
        </label>

        <div />

        <label className="block">
          <span className="text-sm text-slate-300">Street</span>
          <input
            value={form.street}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-white"
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-300">City</span>
          <input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-white"
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-300">State</span>
          <input
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-white"
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-300">Postal code</span>
          <input
            value={form.postal_code}
            onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-white"
          />
        </label>
      </div>

      {/* Username (read-only) */}
<section className="space-y-1">
  <label className="block text-sm text-slate-300">Church username</label>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {/* left: value (disabled) */}
    <input
      value={initial.slug || ''}
      readOnly
      disabled
      className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3
                 text-white placeholder:text-slate-500 focus:border-white"
      placeholder="—"
    />

    {/* right: preview (fixed height so it doesn't jump) */}
    <div className="rounded-2xl border border-slate-700 bg-slate-900/60
                    px-4 py-3 h-[48px] md:h-[48px] flex items-center justify-between">
      <span className="text-sm text-slate-400">Preview</span>
      <span className="text-base text-slate-200">
        /orgs/{initial.slug || 'your-church'}
      </span>
    </div>
  </div>

  <p className="text-xs text-slate-500">
    This is your public URL. Changing it can break links, so it isn’t editable.
  </p>
</section>


      {/* Cover image */}
      <section className="space-y-2">
        <label className="text-sm text-slate-300">Cover image</label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleCoverDrop}
          className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/40"
        >
          <div className="relative w-full h-[clamp(160px,28vh,320px)]">
            <img
              src={coverUrl}
              alt="Cover preview"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-800 p-3">
            <div className="text-xs text-slate-400">
              Drag & drop an image here, or{' '}
              <button
                type="button"
                onClick={pickCover}
                className="underline decoration-slate-500 hover:decoration-slate-300"
              >
                browse
              </button>
              . Suggest 1280×720.
            </div>
            <div className="text-xs text-slate-500">
              {coverUploading ? 'Uploading…' : 'PNG/JPG/WebP'}
            </div>
          </div>

          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleCoverFile(e.target.files?.[0] || null)}
            className="hidden"
          />
        </div>
      </section>

      {/* Logo */}
      <div className="space-y-2">
        <span className="text-sm text-slate-300 block">Logo</span>

        {form.logo_url ? (
          <div className="flex items-center gap-3">
            <img
              src={form.logo_url}
              alt="Org logo"
              className="h-12 w-12 rounded bg-white object-contain p-1"
            />
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, logo_url: '' }))}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={pickLogo}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
            >
              Upload logo
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => onLogoChange(e.target.files?.[0] || null)}
              className="hidden"
            />
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          disabled={busy}
          className="rounded-xl bg-brand-1 px-4 py-2 text-white hover:bg-brand-2 disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        {msg && <span className="text-xs text-slate-400">{msg}</span>}
      </div>
    </form>
  );
}
