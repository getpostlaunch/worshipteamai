// src/app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/utils/supabase/server';

type SocialPlatform = 'instagram' | 'x' | 'facebook' | 'tiktok' | 'youtube' | 'website';

export async function GET() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Get or create profile (prevents "Cannot coerce the result to a single JSON object")
  const { data: profileRow, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  let profile = profileRow as Record<string, any> | null;
  if (!profile) {
    const { data: inserted, error: insErr } = await supabase
      .from('profiles')
      .insert({ id: user.id })
      .select('*')
      .single();
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
    profile = inserted as Record<string, any>;
  }

  // Load socials
  const { data: socials, error: socErr } = await supabase
    .from('social_accounts')
    .select('platform, url')
    .eq('user_id', user.id);
  if (socErr) {
    return NextResponse.json({ error: socErr.message }, { status: 500 });
  }

  // If instruments are stored on profiles as text[]
  const instruments: string[] = Array.isArray(profile.instruments) ? profile.instruments : [];

  return NextResponse.json({ profile, socials, instruments });
}

export async function PUT(req: Request) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    username?: string | null;
    avatar_url?: string | null;
    cover_url?: string | null;
    home_church_url?: string | null;
    intro?: string | null;
    about_html?: string | null;
    intro_video_url?: string | null;
    reel_urls?: string[] | null;
    open_to_gigs?: boolean | null;
    gender?: 'M' | 'F' | null;
    phone?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    zip?: string | null;
    instruments?: string[] | null;
    socials?: { platform: SocialPlatform; url: string | null }[];
  };

  // Upsert profile FIRST (prevents FK violation on social_accounts.user_id)
  const patch: Record<string, any> = {
    username: body.username ?? null,
    avatar_url: body.avatar_url ?? null,
    cover_url: body.cover_url ?? null,
    home_church_url: body.home_church_url ?? null,
    intro: body.intro ?? null,
    about_html: body.about_html ?? null,
    intro_video_url: body.intro_video_url ?? null,
    reel_urls: Array.isArray(body.reel_urls) ? body.reel_urls.slice(0, 4) : null,
    open_to_gigs: body.open_to_gigs ?? null,
    gender: body.gender ?? null,
    phone: body.phone ?? null,
    city: body.city ?? null,
    state: body.state ?? null,
    country: body.country ?? null,
    zip: body.zip ?? null,
  };
  if (Array.isArray(body.instruments)) patch.instruments = body.instruments;

  const { error: upErr } = await supabase
    .from('profiles')
    .upsert([{ id: user.id, ...patch }], { onConflict: 'id' });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 400 });
  }

  // Upsert socials (unique on user_id,platform). Only persist non-empty URLs.
  if (Array.isArray(body.socials)) {
    const cleaned = body.socials
      .map((s) => ({
        user_id: user.id,
        platform: s.platform,
        url: s?.url?.trim() || null,
        handle: null as string | null,
      }))
      .filter((s) => !!s.url);

    if (cleaned.length) {
      const { error: socUpErr } = await supabase
        .from('social_accounts')
        .upsert(cleaned, { onConflict: 'user_id,platform' });
      if (socUpErr) {
        return NextResponse.json({ error: socUpErr.message }, { status: 400 });
      }
    }

    // Delete any existing platforms not included anymore
    const keep = cleaned.map((s) => s.platform);
    if (keep.length === 0) {
  const { error: delAllErr } = await supabase
    .from('social_accounts')
    .delete()
    .eq('user_id', user.id);
  if (delAllErr) {
    return NextResponse.json({ error: delAllErr.message }, { status: 400 });
  }
} else {
  // Build PostgREST 'in' list for enum values: (instagram,x,facebook,...) — no quotes
  const inList = `(${keep.join(',')})`;

  const { error: delErr } = await supabase
    .from('social_accounts')
    .delete()
    .eq('user_id', user.id)
    .not('platform', 'in', inList);
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 400 });
  }
}

  }

  return NextResponse.json({ ok: true });
}
