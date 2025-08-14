"use client";

import { useEffect, useState } from "react";
import AudioPractice from "@/components/AudioPractice"; // your existing component

type Region = {
  id: string;
  label: string | null;
  start_sec: number;
  end_sec: number;
  loop: boolean;
  color: string | null;
};

export default function PracticeClient({ songId, audioUrl }: { songId: string; audioUrl: string }) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load my regions for this song
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/songs/${songId}/regions`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load regions");
        setLoading(false);
        return;
      }
      if (alive) {
        setRegions(data.regions || []);
        setLoading(false);
      }
    })();
    return () => { alive = false };
  }, [songId]);

  // Helpers to persist CRUD (you can call these from your AudioPractice events)
  const createRegion = async (r: Omit<Region, "id">) => {
    const res = await fetch(`/api/songs/${songId}/regions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(r),
    });
    const data = await res.json();
    if (res.ok) setRegions((prev) => [...prev, data.region]);
    return { ok: res.ok, data };
  };

  const updateRegion = async (id: string, patch: Partial<Omit<Region, "id">>) => {
    const res = await fetch(`/api/regions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (res.ok) setRegions((prev) => prev.map((x) => (x.id === id ? { ...x, ...data.region } : x)));
    return { ok: res.ok, data };
  };

  const deleteRegion = async (id: string) => {
    const res = await fetch(`/api/regions/${id}`, { method: "DELETE" });
    if (res.ok) setRegions((prev) => prev.filter((x) => x.id !== id));
    return { ok: res.ok };
  };

  // For now we just render AudioPractice with the audio URL.
  // Next step we'll wire its region events to create/update/delete above.
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <AudioPractice src={audioUrl} />
      <div className="mt-4 text-sm text-slate-300">
        {loading ? "Loading your regions…" : error ? error : `${regions.length} region(s) loaded.`}
      </div>
    </div>
  );
}
