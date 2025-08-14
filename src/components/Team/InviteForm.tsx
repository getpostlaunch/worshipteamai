"use client";
import { useState } from "react";

export default function InviteForm({ orgId }: { orgId: string }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member"|"leader">("member");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/orgs/${orgId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Failed to invite");
      return;
    }
    setEmail("");
    setRole("member");
    setMsg("Invitation sent.");
    if (typeof window !== "undefined") window.location.reload();
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        type="email"
        required
        placeholder="Invite email"
        className="w-60 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-white"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <select
        className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-white"
        value={role}
        onChange={(e) => setRole(e.target.value as any)}
      >
        <option value="member">Member</option>
        <option value="leader">Leader</option>
      </select>
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-brand-1 px-3 py-2 text-sm text-white hover:bg-brand-2 disabled:opacity-60"
      >
        {busy ? "Sending…" : "Invite"}
      </button>
      {msg && <span className="text-xs text-slate-400">{msg}</span>}
    </form>
  );
}
