import { createServerSupabase } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Instagram, Youtube, Twitter, Globe } from 'lucide-react';

export const dynamic = 'force-dynamic';

function chip(text: string) {
  return (
    <span className="inline-block rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-white/20">
      {text}
    </span>
  );
}

const socialIcon: Record<string, React.ElementType> = {
  instagram: Instagram,
  ig: Instagram,
  youtube: Youtube,
  yt: Youtube,
  twitter: Twitter,
  x: Twitter,
  website: Globe,
  site: Globe,
  link: Globe,
};

export default async function UserProfilePage({ params }: { params: { username: string } }) {
  const supabase = await createServerSupabase();

  // profile by username
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      'id,email,display_name,username,avatar_url,cover_url,home_church_url,intro,about_html,intro_video_url,reel_urls,open_to_gigs,gender,phone,city,state,country,zip,updated_at'
    )
    .eq('username', params.username.toLowerCase())
    .single();

  if (error || !profile) return notFound();

  // instruments + socials
  const [{ data: instrRows }, { data: socials }] = await Promise.all([
    supabase.from('user_instruments').select('instruments(name)').eq('user_id', profile.id),
    supabase.from('social_accounts').select('platform,handle,url').eq('user_id', profile.id),
  ]);

  const instruments: string[] = (instrRows || []).map((r: any) => r.instruments?.name).filter(Boolean);

  // simple YouTube embed detect
  const ytId =
    typeof profile.intro_video_url === 'string'
      ? (profile.intro_video_url.match(
          /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/
        )?.[1] ?? null)
      : null;

  const location = [profile.city, profile.state, profile.country, profile.zip].filter(Boolean).join(', ');

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* Cover */}
      <div className="relative h-64 md:h-72 w-full -mx-4 md:mx-0 bg-slate-900">
        {/* Cover image */}
        {profile.cover_url ? (
          <Image
            src={profile.cover_url}
            alt=""
            fill
            className="object-cover opacity-90"
            priority
            sizes="100vw"
          />
        ) : null}
        {/* Overlay gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/30 to-black/60" />
        {/* Identity strip */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-screen-xl px-4 pb-4">
            <div className="flex items-end gap-4">
              <div className="-mb-6 h-24 w-24 overflow-hidden rounded-full ring-4 ring-white shadow-lg">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.display_name || profile.username || 'User'}
                    width={96}
                    height={96}
                    className="h-24 w-24 object-cover"
                  />
                ) : (
                  <div className="h-24 w-24 bg-slate-200" />
                )}
              </div>

              <div className="flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold text-white leading-tight">
                    {profile.display_name || profile.username}
                  </h1>
                  {profile.open_to_gigs ? chip('Open to gigs') : null}
                  {profile.gender ? chip(`Gender: ${profile.gender}`) : null}
                </div>
                <div className="mt-0.5 text-sm text-white/80">@{profile.username}</div>
                {location ? <div className="mt-0.5 text-sm text-white/80">{location}</div> : null}
              </div>

              <div className="hidden md:flex items-center gap-2 pb-1">
                {profile.home_church_url ? (
                  <Link
                    href={profile.home_church_url}
                    target="_blank"
                    className="rounded-xl bg-white/10 px-3 py-2 text-sm text-white ring-1 ring-white/20 hover:bg-white/15"
                  >
                    Home church
                  </Link>
                ) : null}
                <Link
                  href="/gigs"
                  className="rounded-xl bg-brand-1 px-3 py-2 text-sm text-white hover:opacity-90"
                >
                  Post a gig
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-10 pb-10 grid gap-8 md:grid-cols-3">
        {/* Left column */}
        <div className="md:col-span-2 space-y-6">
          {/* Quick chips under avatar on mobile */}
          <div className="flex md:hidden flex-wrap gap-2">
            {profile.open_to_gigs ? (
              <span className="inline-block rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                Open to gigs
              </span>
            ) : null}
            {profile.gender ? (
              <span className="inline-block rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                Gender: {profile.gender}
              </span>
            ) : null}
            {instruments.length ? (
              <span className="inline-block rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                {instruments.join(' • ')}
              </span>
            ) : null}
          </div>

          {profile.intro ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold text-slate-900">Intro</h2>
              <p className="text-slate-800">{profile.intro}</p>
            </div>
          ) : null}

          {/* Intro video or embed */}
          {ytId ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold text-slate-900">Intro video</h2>
              <div className="aspect-video w-full overflow-hidden rounded-xl">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title="Intro video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          ) : profile.intro_video_url ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold text-slate-900">Intro video</h2>
              <video controls className="w-full rounded-xl">
                <source src={profile.intro_video_url} />
              </video>
            </div>
          ) : null}

          {/* Reels */}
          {Array.isArray(profile.reel_urls) && profile.reel_urls.length > 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Reels</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {profile.reel_urls.slice(0, 4).map((url: string, i: number) => (
                  <video key={i} controls className="w-full rounded-xl">
                    <source src={url} />
                  </video>
                ))}
              </div>
            </div>
          ) : null}

          {/* About */}
          {profile.about_html ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold text-slate-900">About</h2>
              <div
                className="prose prose-slate prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: profile.about_html }}
              />
            </div>
          ) : null}
        </div>

        {/* Right column */}
        <aside className="space-y-6">
          {/* Contact */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Contact</h2>
            <div className="space-y-2 text-sm text-slate-800">
              {profile.phone ? <div>Phone: {profile.phone}</div> : null}
              {profile.email ? <div>Email: {profile.email}</div> : null}
            </div>
            <Link
              href="/gigs"
              className="mt-3 inline-block rounded-xl bg-brand-1 px-3 py-2 text-white hover:opacity-90"
            >
              Create a gig for this musician
            </Link>
          </div>

          {/* Socials */}
          {Array.isArray(socials) && socials.length > 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold text-slate-900">Socials</h2>
              <ul className="space-y-2 text-sm">
                {socials.map((s) => {
                  const key = (s.platform || '').toLowerCase();
                  const Icon = socialIcon[key] || Globe;
                  return (
                    <li key={`${s.platform}-${s.handle || s.url}`} className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-slate-600" />
                      <a
                        href={s.url || '#'}
                        target="_blank"
                        className="underline text-slate-800"
                      >
                        {s.handle || s.platform || 'Link'}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {/* Instruments */}
          {instruments.length ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-2 text-lg font-semibold text-slate-900">Instruments</h2>
              <div className="flex flex-wrap gap-2">
                {instruments.map((n) => (
                  <span key={n} className="inline-block rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                    {n}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
