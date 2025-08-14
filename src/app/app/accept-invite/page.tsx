"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AcceptInvitePage() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token");
  const orgId = sp.get("org");

  const [status, setStatus] = useState<"idle"|"ok"|"error">("idle");
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      if (!token || !orgId) {
        setStatus("error");
        setMsg("Missing token or org.");
        return;
      }
      setStatus("idle");
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, orgId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMsg(data.error || "Failed to accept invite.");
        return;
      }
      setStatus("ok");
      setMsg("Invite accepted.");
      setTimeout(() => router.replace(`/orgs/${orgId}/team`), 800);
    };
    run();
  }, [token, orgId, router]);

  return (
    <div className="mx-auto max-w-md px-6 py-16 text-center">
      <h1 className="mb-3 text-2xl font-semibold text-white">Accepting Invitation…</h1>
      {status === "idle" && <p className="text-slate-400">Please wait…</p>}
      {status === "ok" && <p className="text-green-400">{msg}</p>}
      {status === "error" && (
        <div>
          <p className="text-red-400">{msg}</p>
          <button
            className="mt-4 rounded-xl bg-brand-1 px-4 py-2 text-white hover:bg-brand-2"
            onClick={() => router.push("/")}
          >
            Go Home
          </button>
        </div>
      )}
    </div>
  );
}
