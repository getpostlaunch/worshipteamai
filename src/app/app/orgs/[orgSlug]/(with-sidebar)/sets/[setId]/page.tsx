import { notFound } from "next/navigation";
import { createServerSupabase } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

type Params = { orgSlug: string; setId: string };
type SongLite = { id: string; title: string } | null;
type SetItemRow = {
  id: string;
  song_id: string;
  sort_index: number;
  key_override: string | null;
  tempo_override: number | null;
  notes: string | null;
  // Supabase join can return an object OR an array depending on relation inference
  songs: SongLite | SongLite[] | null;
};

const songTitle = (s: SetItemRow["songs"]) =>
  Array.isArray(s) ? s[0]?.title ?? "Untitled" : s?.title ?? "Untitled";

export default async function EditSetPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { orgSlug, setId } = await params; // ✅ Next 15 requires awaiting params
  const supabase = await createServerSupabase(); // ✅ SSR helper

  // Auth
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) notFound();

  // slug -> org
  const { data: org, error: orgErr } = await supabase
    .from("orgs")
    .select("id, slug, name")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (orgErr || !org) notFound();

  // Set row (must belong to org)
  const { data: set, error: setErr } = await supabase
    .from("sets")
    .select("id, org_id, name, service_date")
    .eq("id", setId)
    .maybeSingle();
  if (setErr || !set || set.org_id !== org.id) notFound();

  // My role
  const { data: myMem } = await supabase
    .from("org_memberships")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .is("removed_at", null)
    .maybeSingle();
  const canManage = ["owner", "leader"].includes(myMem?.role ?? "");

  // Items in this set
  const { data: items } = await supabase
    .from("set_items")
    .select(
      "id, song_id, sort_index, key_override, tempo_override, notes, songs:song_id (id, title)"
    )
    .eq("set_id", setId)
    .order("sort_index", { ascending: true });
  const safeItems = (items ?? []) as SetItemRow[];

  // Song choices for adding
  const { data: songChoices } = await supabase
    .from("songs")
    .select("id, title")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });
  const safeChoices = songChoices ?? [];

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{set.name ?? "Untitled set"}</h1>
          <p className="text-sm text-slate-400">
            {set.service_date ? new Date(String(set.service_date)).toDateString() : "No date"}
          </p>
        </div>

        {canManage && (
          // NOTE: This is a plain form. If your API expects JSON fetch, we can
          // add a small client component to handle that later.
          <form
            action={`/api/sets/${set.id}/items`}
            method="post"
            className="flex items-center gap-2"
          >
            <select
              name="song_id"
              className="rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-white"
              defaultValue=""
            >
              <option value="" disabled>
                Add song…
              </option>
              {safeChoices.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title || "Untitled"}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl bg-brand-1 px-3 py-2 text-sm text-white hover:bg-brand-2"
            >
              Add
            </button>
          </form>
        )}
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40">
        <ul className="divide-y divide-slate-800">
          {safeItems.map((it, idx) => (
            <li key={it.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 text-white">{songTitle(it.songs)}</div>

              {/* Practice */}
              <a
                href={`/app/orgs/${org.slug}/practice/${it.song_id}`}
                className="text-xs text-slate-300 hover:text-white"
              >
                Practice →
              </a>

              {canManage && (
                <div className="flex items-center gap-2">
                  {/* Move up */}
                  <form action={`/api/sets/${set.id}/items/${it.id}/move`} method="post">
                    <input type="hidden" name="direction" value="up" />
                    <button
                      disabled={idx === 0}
                      className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:text-white disabled:opacity-40"
                    >
                      ↑
                    </button>
                  </form>

                  {/* Move down */}
                  <form action={`/api/sets/${set.id}/items/${it.id}/move`} method="post">
                    <input type="hidden" name="direction" value="down" />
                    <button
                      disabled={idx === safeItems.length - 1}
                      className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:text-white disabled:opacity-40"
                    >
                      ↓
                    </button>
                  </form>

                  {/* Remove (HTML forms can't send DELETE; use a POST endpoint or handle _method in API) */}
                  <form action={`/api/sets/${set.id}/items/${it.id}/delete`} method="post">
                    <button className="rounded-lg border border-red-600/60 px-2 py-1 text-xs text-red-400 hover:border-red-500 hover:text-red-300">
                      Remove
                    </button>
                  </form>
                </div>
              )}
            </li>
          ))}

          {safeItems.length === 0 && (
            <li className="px-4 py-6 text-sm text-slate-400">No songs in this set yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
