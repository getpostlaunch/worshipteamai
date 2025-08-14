import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: Request) {
  const { orgId } = await req.json();

  const supabase = createRouteHandlerClient({ cookies: async () => cookies() });

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("user_preferences")
    .upsert(
      { user_id: user.id, last_selected_org_id: orgId, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
