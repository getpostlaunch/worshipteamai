import { createServerSupabase } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ApplyButton from '@/components/gigs/ApplyButton';

export const dynamic = 'force-dynamic';

export default async function GigDetailPage({ params }: { params: { slug: string } }) {
  const supabase = await createServerSupabase();

  // auth (for Apply button behavior)
  const { data: auth } = await supabase.auth.getUser();
  const isAuthed = !!auth.user;

  // fetch gig by slug
  const { data: gig, error } = await supabase
    .from('gigs')
    .select(
      'id, slug, title, description_html, event_date, city, state, country, zip, open_to_paid, status, created_at'
    )
    .eq('slug', params.slug)
    .single();

  if (error || !gig) return notFound();

  // instruments needed
  const { data: gi } = await supabase
    .from('gig_instruments')
    .select('instrument_id, need, instruments(name)')
    .eq('gig_id', gig.id);

  const instrumentNames =
    gi?.map((r: any) => ({ name: r.instruments?.name as string, need: r.need as 'required' | 'preferred' }))
      .filter((x) => !!x.name) ?? [];

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{gig.title}</h1>
        <Link href="/gigs" className="text-sm underline">← Back to gigs</Link>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {gig.open_to_paid && (
            <span className="inline-block rounded-full border px-2 py-1 text-xs">Paid</span>
          )}
          {gig.event_date && (
            <span className="text-sm text-gray-600">
              {new Date(gig.event_date).toLocaleDateString()}
            </span>
          )}
          <span className="text-sm text-gray-600">
            {[gig.city, gig.state, gig.zip].filter(Boolean).join(', ')}
          </span>
        </div>

        {instrumentNames.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {instrumentNames.map(({ name, need }) => (
              <span key={name} className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs">
                <span>{name}</span>
                <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide">
                  {need}
                </span>
              </span>
            ))}
          </div>
        )}

        <div className="prose prose-sm max-w-none mt-6">
          {/* description_html is created by org leaders; render as-is */}
          <div dangerouslySetInnerHTML={{ __html: gig.description_html || '' }} />
        </div>

        <div className="mt-8">
          <ApplyButton gigId={gig.id} isAuthed={isAuthed} />
        </div>
      </div>
    </div>
  );
}
