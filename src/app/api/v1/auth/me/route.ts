import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";
import { getCurrentAppUser } from "@/lib/supabase/dire-data";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabaseEnv()) {
    const profile = await getCurrentAppUser();
    return NextResponse.json({ data: { mode: "demo", user: profile }, meta: {} });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHENTICATED",
          message: "No active session.",
        },
      },
      { status: 401 },
    );
  }

  const profile = await getCurrentAppUser();

  return NextResponse.json({
    data: {
      mode: "supabase",
      user: {
        ...profile,
        authUserId: user.id,
      },
    },
    meta: {},
  });
}
