import { hasSupabaseServiceRole } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type JsonLike = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

export async function writeAuditLog(input: {
  action: string;
  module: string;
  newValue?: JsonLike;
  oldValue?: JsonLike;
}) {
  const actorClient = await createClient().catch(() => null);
  const writer = hasSupabaseServiceRole()
    ? createAdminClient()
    : actorClient ?? (await createClient());

  let userId: string | null = null;

  try {
    const {
      data: { user },
    } = actorClient ? await actorClient.auth.getUser() : { data: { user: null } };

    if (user?.id) {
      const profileClient = hasSupabaseServiceRole() ? createAdminClient() : writer;
      const { data: profile } = await profileClient
        .from("users")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      userId = profile?.id ?? null;
    }
  } catch {
    userId = null;
  }

  const { error } = await writer.from("audit_logs").insert({
    action: input.action,
    module: input.module,
    new_value: input.newValue ?? null,
    old_value: input.oldValue ?? null,
    user_id: userId,
  });

  if (error) {
    console.error("Failed to write audit log", {
      action: input.action,
      error: error.message,
      module: input.module,
      userId,
    });
  }
}
