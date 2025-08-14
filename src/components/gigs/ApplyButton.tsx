'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ApplyButton({ gigId, isAuthed }: { gigId: string; isAuthed: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const onClick = () => {
    if (!isAuthed) {
      router.push(`/login?redirect=/gigs/${gigId}`); // adjust to your login route
      return;
    }
    setOpen(true);
  };

  const submit = async () => {
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch(`/api/gigs/${gigId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          contact_email: contactEmail || undefined,
          contact_phone: contactPhone || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data?.error || 'Something went wrong');
      } else {
        setOk(true);
      }
    } catch (e: any) {
      setErr(e?.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <button
        onClick={onClick}
        className="rounded-xl bg-brand-1 text-white px-4 py-2"
      >
        Apply for this gig
      </button>

      {/* simple modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Apply</h2>
              <button className="text-sm text-gray-500" onClick={() => setOpen(false)}>✕</button>
            </div>

            {ok ? (
              <div className="text-green-600">Application sent. We’ll let the poster know.</div>
            ) : (
              <>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 mb-3"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell them why you’re a good fit..."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact email (optional)</label>
                    <input
                      type="email"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact phone (optional)</label>
                    <input
                      type="tel"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>
                </div>

                {err && <div className="mt-3 text-sm text-red-600">{err}</div>}

                <div className="mt-4 flex items-center justify-end gap-3">
                  <button className="rounded-xl border px-4 py-2" onClick={() => setOpen(false)}>
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={submitting || !message.trim()}
                    className="rounded-xl bg-brand-1 text-white px-4 py-2 disabled:opacity-50"
                  >
                    {submitting ? 'Sending…' : 'Send application'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
