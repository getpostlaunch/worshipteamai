import type { Metadata } from 'next';
import Header from '@/components/Header';
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
        <Header />
        {/* 960 -> 1440; keep centered */}
        <main style={{ maxWidth: 1440, margin: '24px auto', padding: '0 16px' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
