// src/components/Footer.tsx
import Image from 'next/image';

type User = {
  name: string;
  email: string;
  avatarUrl?: string | null;
};

type Props = {
  user?: User | null; // if present -> show "App", else Login + Signup
};

const LINKS = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/teams', label: 'Teams' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

export default function Footer({ user }: Props) {
  return (
    <footer className="bg-black text-slate-300">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-10">
        {/* Top row */}
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          {/* Left: Logo + Social */}
          <div className="flex flex-col gap-4">
            <a href="/" className="inline-flex items-center gap-2">
              <Image src="/assets/images/logo.svg" alt="WorshipTeam AI" width={120} height={44} />
            </a>

            <div className="flex items-center gap-4">
              {/* Instagram */}
              <a
                href="https://instagram.com"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-800 transition"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5a5.5 5.5 0 1 1 0 11.001A5.5 5.5 0 0 1 12 7.5zm0 2a3.5 3.5 0 1 0 0 7.001 3.5 3.5 0 0 0 0-7.001zM18 6.25a1 1 0 1 1 0 2.001 1 1 0 0 1 0-2.001z" />
                </svg>
              </a>
              {/* Facebook */}
              <a
                href="https://facebook.com"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-800 transition"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M13.5 22v-8h2.6l.4-3h-3v-1.9c0-.9.3-1.5 1.7-1.5H16V4.1C15.7 4 14.8 4 13.8 4 11.6 4 10 5.4 10 8.1V11H7.5v3H10v8h3.5z" />
                </svg>
              </a>
              {/* X / Twitter */}
              <a
                href="https://x.com"
                aria-label="X (Twitter)"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-800 transition"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M4 3h4.6l4 5.4L17.7 3H21l-6.6 7.4L22 21h-4.6l-4.3-5.9L6.3 21H3l7-7.9L4 3zm3.6 2H6.2l10 14h1.4l-10-14z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Middle: Nav links */}
          <nav className="grid grid-cols-2 gap-x-8 gap-y-3 sm:flex sm:flex-wrap sm:gap-6">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-slate-300 hover:text-white transition"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Right: Conditional auth/app */}
          <div className="flex items-center gap-4">
            {!user ? (
              <>
                <a href="/login" className="text-slate-300 hover:text-white transition">
                  Login
                </a>
                <a
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-white shadow hover:bg-indigo-400 transition"
                >
                  Signup
                </a>
              </>
            ) : (
              <a
                href="/app"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-white shadow hover:bg-indigo-400 transition"
              >
                App
              </a>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-slate-800/60 my-6" />

        {/* Bottom row */}
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">
            © 2025 WorshipTeam AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
