"use client";

import { useRef, useState } from "react";
import { supabase as createBrowserSupabase } from "@/utils/supabaseClient";

export default function UploadOrgSong({ orgId }: { orgId: string }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onPick = () => fileRef.current?.click();

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setBusy(true);
    setMsg(null);

    try {
      // 1) Create song row & get upload path
      const createRes = await fetch(`/api/orgs/${orgId}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: f.name.replace(/\.[^.]+$/, "") }),
      });
      const created = await createRes.json();
      if (!createRes.ok) {
        throw new Error(created?.error || "Failed to start upload.");
      }

      const { songId, uploadPath } = created as {
        songId: string;
        uploadPath: string;
      };

      // 2) Upload file to Storage (browser client)
      const supabase = createBrowserSupabase();
      const up = await supabase.storage
        .from("songs")
        .upload(uploadPath, f, { upsert: true, contentType: f.type || "audio/mpeg" });

      if (up.error) throw up.error;

      // 3) Finalize DB (file_path + status)
      const finRes = await fetch(`/api/songs/${songId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file_path: uploadPath, status: "uploaded" }),
      });
      const fin = await finRes.json();
      if (!finRes.ok) {
        throw new Error(fin?.error || "Saved file but failed to finalize.");
      }

      setMsg("Uploaded.");
      // Allow re-upload of same file name
      if (fileRef.current) fileRef.current.value = "";
      if (typeof window !== "undefined") window.location.reload();
    } catch (err: any) {
      setMsg(err?.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input
        type="file"
        accept="audio/*"
        ref={fileRef}
        onChange={onChange}
        className="hidden"
      />
      <button
        onClick={onPick}
        disabled={busy}
        className="rounded-xl bg-brand-1 px-4 py-2 text-white hover:bg-brand-2 disabled:opacity-60"
      >
        {busy ? "Uploading…" : "Upload song"}
      </button>
      {msg && <span className="text-xs text-slate-400">{msg}</span>}
    </div>
  );
}
