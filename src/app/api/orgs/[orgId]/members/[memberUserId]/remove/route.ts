import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(
  _req: Request,
  { params }: { params: { orgId: string; memberUserId: string } }
) {
  const { orgId, memberUserId } = params;
  const supabase = createRouteHandlerClient({ cookies: async () => cookies() });

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Soft delete membership (RLS enforces role)
  const { error } = await supabase
    .from("org_memberships")
    .update({ removed_at: new Date().toISOString() })
    .eq("org_id", orgId)
    .eq("user_id", memberUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
