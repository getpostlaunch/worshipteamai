'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import {
  FaInstagram,
  FaTwitter,
  FaFacebook,
  FaTiktok,
  FaYoutube,
  FaGlobe,
} from 'react-icons/fa';

type SocialPlatform = 'instagram' | 'x' | 'facebook' | 'tiktok' | 'youtube' | 'website';

const SOCIALS: { key: SocialPlatform; Icon: any; placeholder: string }[] = [
  { key: 'instagram', Icon: FaInstagram, placeholder: 'https://instagram.com/your-username' },
  { key: 'x',         Icon: FaTwitter,   placeholder: 'https://x.com/your-username' },
  { key: 'facebook',  Icon: FaFacebook,  placeholder: 'https://facebook.com/your-username' },
  { key: 'tiktok',    Icon: FaTiktok,    placeholder: 'https://tiktok.com/@your-username' },
  { key: 'youtube',   Icon: FaYoutube,   placeholder: 'https://youtube.com/@your-username' },
  { key: 'website',   Icon: FaGlobe,     placeholder: 'https://your-website.com' },
];

const DEFAULT_AVATAR = '/assets/images/avatar.jpg';
const DEFAULT_COVER  = '/assets/images/user-cover.jpg';

type Tab = 'who' | 'instruments' | 'socials';

export default function AccountClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // tabs
  const [tab, setTab] = useState<Tab>('who');

  // read-only identity
  const [email, setEmail] = useState('');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [username, setUsername] = useState(''); // displayed read-only

  // core flags
  const [openToGigs, setOpenToGigs] = useState(false);
  const [gender, setGender] = useState<'M' | 'F' | ''>('');

  // media
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarRemove, setAvatarRemove] = useState(false);

  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverRemove, setCoverRemove] = useState(false);

  // basics
  const [homeChurchUrl, setHomeChurchUrl] = useState('');
  const [intro, setIntro] = useState('');
  const [aboutHtml, setAboutHtml] = useState('');
  const [introVideoUrl, setIntroVideoUrl] = useState('');
  const [reels, setReels] = useState<string[]>(['', '', '', '']);

  // contact / location
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [stateProv, setStateProv] = useState('');
  const [country, setCountry] = useState('');
  const [zip, setZip] = useState('');

  // instruments
  const [allInstruments, setAllInstruments] = useState<{ id: string; name: string }[]>([]);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);

  // socials
  const [socials, setSocials] = useState<Record<SocialPlatform, string>>({
    instagram: '',
    x: '',
    facebook: '',
    tiktok: '',
    youtube: '',
    website: '',
  });

  useEffect(() => {
    (async () => {
      setMsg('');
      setLoading(true);
      try {
        const client = supabase();
        const { data: auth } = await client.auth.getUser();
        if (!auth.user) return;

        setEmail(auth.user.email || '');
        const meta = (auth.user.user_metadata || {}) as any;
        setFirst(meta.first_name || meta.given_name || '');
        setLast(meta.last_name || meta.family_name || '');

        const res = await fetch('/api/profile', { cache: 'no-store' });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          setMsg(e?.error || 'Failed to load profile');
          return;
        }
        const payload = await res.json();
        const p = payload.profile || {};

        setUsername(p.username || '');
        setAvatarUrl(p.avatar_url || null);
        setCoverUrl(p.cover_url || null);
        setHomeChurchUrl(p.home_church_url || '');
        setIntro(p.intro || '');
        setAboutHtml(p.about_html || '');
        setIntroVideoUrl(p.intro_video_url || '');
        setReels(Array.isArray(p.reel_urls) ? [...p.reel_urls, '', '', '', ''].slice(0, 4) : ['', '', '', '']);
        setOpenToGigs(!!p.open_to_gigs);
        setGender(p.gender ?? '');
        setPhone(p.phone || '');
        setCity(p.city || '');
        setStateProv(p.state || '');
        setCountry(p.country || '');
        setZip(p.zip || '');
        setSelectedInstruments((payload.instruments || []) as string[]);

        const socialsArr: { platform: SocialPlatform; url?: string }[] =
          (payload.socials || []).map((s: any) => ({ platform: s.platform, url: s.url || '' }));
        setSocials(prev => {
          const next = { ...prev };
          for (const row of socialsArr) if (row.platform) next[row.platform] = row.url || '';
          return next;
        });

        const { data: inst } = await client
          .from('instruments')
          .select('id,name')
          .eq('is_active', true)
          .order('name');
        setAllInstruments(inst || []);
      } catch (e: any) {
        setMsg(e?.message || 'Load error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const uploadToBucket = async (file: File, prefix: 'avatar' | 'cover') => {
    const client = supabase();
    const safeName = file.name.replace(/\s+/g, '_').toLowerCase();
    const path = `${prefix}_${Date.now()}_${safeName}`;
    const { error: upErr } = await client.storage.from('avatars').upload(path, file, { upsert: false });
    if (upErr) throw new Error(upErr.message);
    const { data: pub } = client.storage.from('avatars').getPublicUrl(path);
    return pub.publicUrl as string;
  };

  function toggleInstrument(name: string) {
    setSelectedInstruments(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  }

  function sanitizeAbout(input: string) {
    if (!input) return '';
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${input}</div>`, 'text/html');
      const allowed = new Set(['DIV','P','BR','STRONG','EM','UL','OL','LI','BLOCKQUOTE','H1','H2','H3','SPAN']);
      const walk = (node: Node) => {
        const el = node as HTMLElement;
        if (el.nodeType === 1 && el.tagName === 'A') {
          const txt = document.createTextNode(el.textContent || '');
          el.parentNode?.replaceChild(txt, el);
          return;
        }
        if (el.nodeType === 1 && !allowed.has(el.tagName)) {
          while (el.firstChild) el.parentNode?.insertBefore(el.firstChild, el);
          el.parentNode?.removeChild(el);
          return;
        }
        if (el.nodeType === 1) {
          [...el.attributes].forEach(attr => {
            const n = attr.name.toLowerCase();
            if (n.startsWith('on') || n === 'style' || n === 'href' || n === 'srcset') el.removeAttribute(attr.name);
          });
        }
        [...(el.childNodes as any)].forEach(walk);
      };
      [...(doc.body.childNodes as any)].forEach(walk);
      return (doc.body.firstElementChild as HTMLElement)?.innerHTML || '';
    } catch {
      return input.replace(/<[^>]*>/g, '');
    }
  }

  // DnD helpers
  const prevent = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent, kind: 'avatar' | 'cover') => {
    prevent(e);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (kind === 'avatar') {
      setAvatarFile(f);
      setAvatarRemove(false);
      setAvatarUrl(URL.createObjectURL(f));
    } else {
      setCoverFile(f);
      setCoverRemove(false);
      setCoverUrl(URL.createObjectURL(f));
    }
  };

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setSaving(true);
    try {
      const patch: any = {
        username: username?.trim() || null, // API‑compatible; shown read-only
        home_church_url: homeChurchUrl || null,
        intro: intro || null,
        about_html: sanitizeAbout(aboutHtml) || null,
        intro_video_url: introVideoUrl || null,
        reel_urls: reels.map(r => r.trim()).filter(Boolean).slice(0, 4),
        open_to_gigs: openToGigs,
        gender: gender || null,
        phone: phone || null,
        city: city || null,
        state: stateProv || null,
        country: country || null,
        zip: zip || null,
        instruments: selectedInstruments,
        socials: SOCIALS
          .map(s => ({ platform: s.key, url: (socials[s.key] || '').trim() || null }))
          .filter(s => s.url),
      };

      if (avatarRemove) {
        patch.avatar_url = null;
      } else if (avatarFile) {
        const url = await uploadToBucket(avatarFile, 'avatar');
        patch.avatar_url = url;
        setAvatarUrl(url);
      } else if (avatarUrl) {
        patch.avatar_url = avatarUrl;
      }

      if (coverRemove) {
        patch.cover_url = null;
      } else if (coverFile) {
        const url = await uploadToBucket(coverFile, 'cover');
        patch.cover_url = url;
        setCoverUrl(url);
      } else if (coverUrl) {
        patch.cover_url = coverUrl;
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data?.error || 'Save failed');
        return;
      }

      setMsg('Profile saved.');
      setAvatarFile(null);
      setCoverFile(null);
      setAvatarRemove(false);
      setCoverRemove(false);
    } catch (e: any) {
      setMsg(e?.message || 'Save error');
    } finally {
      setSaving(false);
    }
  }

  // styles
  const label = 'block text-sm font-medium text-white mb-1';
  const input = 'w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-1';
  const smallInput = 'w-full rounded-xl border border-slate-700 bg-slate-800 pl-11 pr-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-1';
  const inputIconWrap = 'relative';
  const inputIcon = 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300';

  const avatarPreview = useMemo(() => avatarUrl || DEFAULT_AVATAR, [avatarUrl]);
  const coverPreview  = useMemo(() => coverUrl  || DEFAULT_COVER,  [coverUrl]);

  const TabBtn = ({ id, title, step }: { id: Tab; title: string; step: number }) => {
    const active = tab === id;
    return (
      <button
        type="button"
        onClick={() => setTab(id)}
        className={[
          'flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold border transition',
          active
            ? 'bg-brand-1 border-brand-1 text-white'
            : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
        ].join(' ')}
        aria-pressed={active}
      >
        <span className={[
          'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
          active ? 'bg-white text-brand-1' : 'bg-slate-700 text-slate-100'
        ].join(' ')}>{step}</span>
        {title}
      </button>
    );
  };

  return (
    <div className="w-full flex justify-center px-4 py-10">
      <div className="w-full max-w-5xl space-y-6">
        {/* ======= READ-ONLY BOX ======= */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-white">Account</h1>
          <p className="text-sm text-slate-400 mt-1">These are managed by auth and not editable here.</p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className={label}>First name</label>
              <div className="rounded-xl border border-slate-800 bg-slate-800/60 px-4 py-3 text-slate-200">{first || '—'}</div>
            </div>
            <div>
              <label className={label}>Last name</label>
              <div className="rounded-xl border border-slate-800 bg-slate-800/60 px-4 py-3 text-slate-200">{last || '—'}</div>
            </div>
            <div>
              <label className={label}>Username</label>
              <div className="rounded-xl border border-slate-800 bg-slate-800/60 px-4 py-3 text-slate-200">{username || '—'}</div>
            </div>
            <div>
              <label className={label}>Email</label>
              <div className="rounded-xl border border-slate-800 bg-slate-800/60 px-4 py-3 text-slate-200">{email || '—'}</div>
            </div>
          </div>
        </section>

        {/* ======= BIG TAB BAR (CLEAR) ======= */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex flex-wrap gap-3">
            <TabBtn id="who" title="Who you are" step={1} />
            <TabBtn id="instruments" title="Instruments you play" step={2} />
            <TabBtn id="socials" title="Social media" step={3} />
          </div>
        </div>

        {/* ======= EDITABLE CARD ======= */}
        <form onSubmit={onSave} className="rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8 shadow-sm space-y-8">
          {/* WHO */}
          {tab === 'who' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-white">Your photos</h2>
                <p className="text-sm text-slate-400 mt-1">Drag & drop supported.</p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Avatar */}
                  <div>
                    <label className={label}>Avatar</label>
                    <div
                      onDragOver={prevent}
                      onDragEnter={prevent}
                      onDrop={(e) => handleDrop(e, 'avatar')}
                      className="flex items-center gap-4"
                    >
                      <div className="h-24 w-24 overflow-hidden rounded-2xl ring-1 ring-slate-700 bg-slate-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center rounded-xl border border-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-800 cursor-pointer">
                          <input
                            type="file" accept="image/*" className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0] ?? null;
                              setAvatarFile(f); setAvatarRemove(false);
                              if (f) setAvatarUrl(URL.createObjectURL(f));
                            }}
                          />
                          Change
                        </label>
                        <button
                          type="button"
                          onClick={() => { setAvatarFile(null); setAvatarUrl(null); setAvatarRemove(true); }}
                          className="inline-flex items-center rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                        >
                          Remove
                        </button>
                        <span className="text-xs text-slate-400">Drag & drop to replace</span>
                      </div>
                    </div>
                  </div>

                  {/* Cover */}
                  <div>
                    <label className={label}>Cover</label>
                    <div
                      onDragOver={prevent}
                      onDragEnter={prevent}
                      onDrop={(e) => handleDrop(e, 'cover')}
                      className="grid grid-cols-[224px_1fr] gap-4 items-center"
                    >
                      <div className="h-16 w-56 overflow-hidden rounded-xl ring-1 ring-slate-700 bg-slate-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={coverPreview} alt="Cover" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center rounded-xl border border-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-800 cursor-pointer">
                          <input
                            type="file" accept="image/*" className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0] ?? null;
                              setCoverFile(f); setCoverRemove(false);
                              if (f) setCoverUrl(URL.createObjectURL(f));
                            }}
                          />
                          Change
                        </label>
                        <button
                          type="button"
                          onClick={() => { setCoverFile(null); setCoverUrl(null); setCoverRemove(true); }}
                          className="inline-flex items-center rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                        >
                          Remove
                        </button>
                        <span className="text-xs text-slate-400">Drag & drop to replace</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Basics */}
              <div>
                <h2 className="text-lg font-semibold text-white">Basics</h2>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <input id="openToGigs" type="checkbox" checked={openToGigs} onChange={(e) => setOpenToGigs(e.target.checked)} />
                    <label htmlFor="openToGigs" className="text-white text-sm">Open to gigs</label>
                  </div>
                  <div>
                    <label className={label}>Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender((e.target.value || '') as 'M' | 'F' | '')}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-1"
                    >
                      <option value="">—</option>
                      <option value="M">M</option>
                      <option value="F">F</option>
                    </select>
                  </div>
                  <div>
                    <label className={label}>Home church URL</label>
                    <input className={input} value={homeChurchUrl} onChange={(e) => setHomeChurchUrl(e.target.value)} placeholder="https://..." />
                  </div>
                </div>

                <div className="mt-4 grid gap-4">
                  <div>
                    <label className={label}>Intro (short)</label>
                    <textarea className={input} rows={2} value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="One or two lines about you" />
                  </div>
                  <div>
                    <label className={label}>About (basic HTML allowed — links removed)</label>
                    <textarea className={`${input} font-mono`} rows={6} value={aboutHtml} onChange={(e) => setAboutHtml(e.target.value)} placeholder="<p>I play...</p>" />
                  </div>
                </div>

                <div className="mt-4 grid gap-4">
                  <div>
                    <label className={label}>Intro video URL</label>
                    <input className={input} value={introVideoUrl} onChange={(e) => setIntroVideoUrl(e.target.value)} placeholder="YouTube or direct video URL" />
                  </div>
                  <div>
                    <label className={label}>Reels (up to 4)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {reels.map((r, i) => (
                        <input
                          key={i}
                          className={input}
                          value={r}
                          onChange={(e) => { const copy = [...reels]; copy[i] = e.target.value; setReels(copy); }}
                          placeholder={`Reel ${i + 1} URL`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-white mb-2">Contact & location</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div><label className={label}>Phone</label><input className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-1" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" /></div>
                    <div><label className={label}>City</label><input className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-1" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" /></div>
                    <div><label className={label}>State</label><input className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-1" value={stateProv} onChange={(e) => setStateProv(e.target.value)} placeholder="State" /></div>
                    <div><label className={label}>Country</label><input className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-1" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" /></div>
                    <div><label className={label}>ZIP</label><input className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-1" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="ZIP" /></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* INSTRUMENTS */}
          {tab === 'instruments' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Instruments you play</h2>
              <p className="text-sm text-slate-400">Pick everything you’re comfortable playing.</p>
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">
                    {selectedInstruments.length ? `${selectedInstruments.length} selected` : 'Nothing selected yet'}
                  </span>
                  {!allInstruments?.length && <span className="text-xs text-slate-400">No instruments found — seed your lookup in the DB.</span>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {allInstruments.map((i) => {
                    const checked = selectedInstruments.includes(i.name);
                    return (
                      <label
                        key={i.id}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer ${
                          checked ? 'bg-slate-800 border-slate-600 text-white' : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                      >
                        <input type="checkbox" checked={checked} onChange={() => toggleInstrument(i.name)} />
                        <span className="truncate">{i.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SOCIALS */}
          {tab === 'socials' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Social media</h2>
              <p className="text-sm text-slate-400">Drop your links so your team can follow your work.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SOCIALS.map(({ key, Icon, placeholder }) => (
                  <div key={key}>
                    <label className="sr-only">{key}</label>
                    <div className={inputIconWrap}>
                      <Icon className={inputIcon} size={18} />
                      <input
                        aria-label={key}
                        className={smallInput}
                        placeholder={placeholder}
                        value={socials[key]}
                        onChange={(e) => setSocials({ ...socials, [key]: e.target.value })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions + step nav */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-xl bg-brand-1 px-5 py-3 text-white disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              {msg && (
                <span
                  className={[
                    'text-sm px-3 py-2 rounded-lg border',
                    msg.toLowerCase().includes('fail') || msg.toLowerCase().includes('error')
                      ? 'text-red-300 bg-red-900/30 border-red-700'
                      : 'text-green-300 bg-green-900/30 border-green-700',
                  ].join(' ')}
                >
                  {msg}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {tab !== 'who' && (
                <button
                  type="button"
                  onClick={() => setTab(tab === 'socials' ? 'instruments' : 'who')}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
                >
                  ← Back
                </button>
              )}
              {tab === 'who' && (
                <button
                  type="button"
                  onClick={() => setTab('instruments')}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
                >
                  Next: Instruments →
                </button>
              )}
              {tab === 'instruments' && (
                <button
                  type="button"
                  onClick={() => setTab('socials')}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
                >
                  Next: Social media →
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
