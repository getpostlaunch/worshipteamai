import Link from 'next/link';
import SelectedSongPlayer from '@/components/SelectedSongPlayer';

export default async function SongDetailPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params; // ⬅️ important: await params

  return (
    <div className="w-full max-w-[1440px] space-y-4">
      {/* Breadcrumb */}
      <nav className="text-sm">
        <Link href="/app" className="text-brand-5 hover:underline">
          Back to all songs
        </Link>
      </nav>

      {/* Full-width waveform + controls */}
      <section className="w-full bg-neutral-900 rounded-2xl">
        <div className="w-full p-4 md:p-6">
          <SelectedSongPlayer id={id} />
        </div>
      </section>
    </div>
  );
}
