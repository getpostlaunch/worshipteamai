import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: Request, { params }: { params: { orgId: string } }) {
  const { orgId } = params;
  const { name, service_date } = await req.json();

  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("sets").insert({
      org_id: orgId, name, service_date: service_date || null, created_by: user.id
    })
    .select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data!.id });
}
