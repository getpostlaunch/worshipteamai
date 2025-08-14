import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // set this in env

export async function POST(req: Request) {
  const { token, orgId } = await req.json();
  if (!token || !orgId) {
    return NextResponse.json({ error: "Missing token or orgId" }, { status: 400 });
  }

  // who is accepting?
  const supabaseUserScoped = createRouteHandlerClient({ cookies: async () => cookies() });
  const { data: { user } } = await supabaseUserScoped.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // admin client for invite lookup + membership insert
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  // find valid invite
  const { data: invite, error: invErr } = await admin
    .from("org_invitations")
    .select("*")
    .eq("org_id", orgId)
    .eq("token_hash", tokenHash)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .single();

  if (invErr || !invite) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 400 });
  }

  // email must match
  const inviteEmail = String(invite.email).toLowerCase().trim();
  const userEmail = String(user.email || "").toLowerCase().trim();
  if (inviteEmail !== userEmail) {
    return NextResponse.json({ error: "This invite is for a different email." }, { status: 403 });
  }

  // create/restore membership
  const { error: memErr } = await admin
    .from("org_memberships")
    .upsert(
      { org_id: orgId, user_id: user.id, role: invite.role, removed_at: null },
      { onConflict: "org_id,user_id" }
    );
  if (memErr) return NextResponse.json({ error: memErr.message }, { status: 400 });

  // mark invite accepted
  await admin
    .from("org_invitations")
    .update({ status: "accepted" })
    .eq("id", invite.id);

  // store preference
  await supabaseUserScoped
    .from("user_preferences")
    .upsert({ user_id: user.id, last_selected_org_id: orgId });

  return NextResponse.json({ ok: true, orgId });
}
