export default function LandingPage() {
  return (
    <main className="min-h-screen bg-brand-3 text-brand-5">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[34rem] w-[34rem] rounded-full bg-brand-1/10 blur-3xl" />
        </div>
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6 flex flex-col items-start justify-center">
            <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
              AI practice app<br></br>for worship teams.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-gray-300 max-w-xl">
              Isolate parts, loop sections, change tempo & key, with keyboard shortcuts, & more. Built by worship musicians that take practice seriously.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="/signup" className="px-5 py-3 rounded-xl bg-blue-600 text-gray-100 hover:bg-blue-500 transition font-bold">TRY FOR FREE</a>
            </div>
            <p className="mt-3 text-xs text-gray-400">Try a song for free. You'll love it.</p>
          </div>
          <div className="lg:col-span-6">
            {/* App preview placeholder */}
            <div className="aspect-video w-full rounded-2xl bg-white shadow-md border border-gray-200 p-4">
              <div className="h-full w-full rounded-xl border border-dashed border-gray-300 grid place-items-center text-gray-500">
                App preview / screenshot
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof / badges */}
      <section className="py-6 bg-gray-900 rounded-xl">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-gray-300">
            <span className="inline-flex items-center gap-2"><strong className="font-semibold">Upload MP3 or WAV</strong></span>
            <span className="inline-flex items-center gap-2"><strong className="font-semibold">Save regions</strong></span>
            <span className="inline-flex items-center gap-2"><strong className="font-semibold">Stems</strong></span>
            <span className="inline-flex items-center gap-2"><strong className="font-semibold">AI helpers</strong></span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight">Practice efficiently</h2>
            <p className="mt-3 text-gray-400">Change keys, tempo, auto loop regions, isolate tracks, & more.</p>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Regions', desc: 'Create multiple regions. Name them, save them, loop them, & nail them.' },
              { title: 'Stems', desc: 'Isolate vocals, drums, bass, and more to hear parts clearly. Then nail them.' },
              { title: 'Pitch & Tempo', desc: 'Change key and speed independently and save your settings per song.' },
              { title: 'Shortcuts', desc: 'Keyboard shortcuts for quick and easy access. Get those hands back to your instrument.' },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl bg-slate-900 p-6">
                <div className="h-10 w-10 rounded-xl bg-slate-300 grid place-items-center mb-4">
                  <div className="h-4 w-4 rounded " />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-md text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 lg:py-20 bg-black">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Upload or paste a link', desc: 'Add an MP3/WAV (YouTube import coming).' },
              { step: '2', title: 'Practice smarter', desc: 'Set loops, change key, match tempo, and lock in parts.' },
              { step: '3', title: 'Share with the team', desc: 'Keep everyone in sync with the same settings.' },
            ].map((s) => (
              <div key={s.step} className="relative rounded-2xl border border-gray-200 p-6 bg-brand-3">
                <span className="absolute -top-3 left-6 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-1 text-white text-sm font-semibold shadow">{s.step}</span>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-700">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20 bg-indigo-500 rounded-xl">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-brand-5 text-white p-8 lg:p-12 grid lg:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Ready to get your team Sunday‑ready?</h3>
              <p className="mt-2 text-white/80">Start free. No installs. Works on any modern browser.</p>
            </div>
            <div className="flex gap-3 lg:justify-end">
              <a href="/signup" className="px-5 py-3 rounded-xl bg-brand-1 text-white hover:bg-brand-2 transition font-medium">Create account</a>
              <a href="/app" className="px-5 py-3 rounded-xl bg-white text-brand-5 hover:bg-gray-100 transition font-medium">Open the app</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
