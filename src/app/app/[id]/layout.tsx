import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WorshipTeam AI — Song',
};

export default function SongLayout({ children }: { children: React.ReactNode }) {
  // Single column, full width container (no sidebar)
  return (
    <div className="w-full max-w-[1440px] bg-black">
      {children}
    </div>
  );
}
