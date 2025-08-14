import type { Metadata } from 'next';
import HeaderServer from '@/components/HeaderServer';
import FooterServer from '@/components/FooterServer';
import './globals.css';

export const metadata: Metadata = {
  title: 'WorshipTeam AI',
  description: 'Practice songs smarter',
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-black">
        <HeaderServer />
        <main style={{ maxWidth: 1440, margin: '0 auto', padding: '0 16px' }}>
          {children}
          <FooterServer />
        </main>
      </body>
    </html>
  );
}
