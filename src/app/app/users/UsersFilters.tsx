'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

type Props = {
  instruments: string[];
  initial: {
    q?: string;
    instrument?: string;
    gender?: string;
    city?: string;
    zip?: string;
  };
};

export default function UsersFilters({ instruments, initial }: Props) {
  const router = useRouter();
  const search = useSearchParams();

  const genders = useMemo(() => ['M', 'F', 'Non-binary', 'Prefer not to say'], []);

  const apply = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(search?.toString() || '');
      Object.entries(updates).forEach(([k, v]) => {
        const val = v.trim();
        if (!val) params.delete(k);
        else params.set(k, val);
      });
      // always reset page if you add pagination later
      router.push(`/app/users?${params.toString()}`);
    },
    [router, search]
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 md:p-4 shadow-sm">
      <form
        className="grid grid-cols-1 md:grid-cols-6 gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget as HTMLFormElement;
          const data = new FormData(form);
          apply({
            q: String(data.get('q') || ''),
            instrument: String(data.get('instrument') || ''),
            gender: String(data.get('gender') || ''),
            city: String(data.get('city') || ''),
            zip: String(data.get('zip') || ''),
          });
        }}
      >
        <input
          name="q"
          defaultValue={initial.q || ''}
          placeholder="Search name or username…"
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-1/40"
        />

        <select
          name="instrument"
          defaultValue={initial.instrument || ''}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">All instruments</option>
          {instruments.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <select
          name="gender"
          defaultValue={initial.gender || ''}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Any gender</option>
          {genders.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <input
          name="city"
          defaultValue={initial.city || ''}
          placeholder="City"
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
        />

        <input
          name="zip"
          defaultValue={initial.zip || ''}
          placeholder="Zip"
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
        />

        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-1 px-3 py-2 text-sm text-white"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => router.push('/app/users')}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
