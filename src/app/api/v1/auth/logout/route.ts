import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/login?force=1", url.origin));
}

export async function POST() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ data: { mode: "demo" }, meta: {} });
  }

  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.json({ data: { success: true }, meta: {} });
}
