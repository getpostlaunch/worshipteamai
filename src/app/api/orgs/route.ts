import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabase } from '@/utils/supabase/server';

function slugify(input: string) {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const name = (body?.name ?? '').trim();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const slug = slugify(name);

  // Always set created_by; include optional fields if present
  const payload: Record<string, any> = {
    name,
    slug,
    created_by: user.id, // <-- required by your NOT NULL constraint
  };
  for (const k of ['street', 'city', 'state', 'postal_code', 'logo_url'] as const) {
    if (k in (body ?? {})) payload[k] = body[k] ?? null;
  }

  const { data: org, error } = await supabase
    .from('orgs')
    .insert(payload)
    .select('id, slug')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, slug: org.slug });
}
