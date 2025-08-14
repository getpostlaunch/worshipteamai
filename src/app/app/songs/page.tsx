import { redirect } from "next/navigation";
import { createServerSupabase } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function MySongsPage() {
  const supabase = await createServerSupabase();

  // Auth
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) redirect("/login");

  // User's songs
  const { data: songs } = await supabase
    .from("songs")
    .select("id, title, created_at, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items =
    songs?.map((s) => ({ ...s, created_at: String(s.created_at) })) ?? [];

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">My Songs</h1>
        <a
          href="/app"
          className="rounded-xl bg-brand-1 px-3 py-2 text-sm text-white hover:bg-brand-2"
        >
          Upload
        </a>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40">
        <ul className="divide-y divide-slate-800">
          {items.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-white">{s.title || "Untitled"}</div>
                <div className="text-xs text-slate-400">
                  {new Date(s.created_at).toLocaleDateString()} • {s.status ?? "—"}
                </div>
              </div>
              <a
                href={`/app/practice/${s.id}`}
                className="text-sm text-slate-300 hover:text-white"
              >
                Practice →
              </a>
            </li>
          ))}
          {items.length === 0 && (
            <li className="px-4 py-6 text-sm text-slate-400">No songs yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
