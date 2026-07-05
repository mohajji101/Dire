import { apiError, ok } from "@/lib/api-responses";
import { hasSupabaseEnv, hasSupabaseServiceRole } from "@/lib/env";
import { writeAuditLog } from "@/lib/supabase/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function PUT(_: Request, { params }: RouteProps) {
  const { id } = await params;

  if (!hasSupabaseEnv()) {
    return ok({ id, read: true }, { mode: "demo" });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return apiError("UNAUTHENTICATED", "No active session.", 401);
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile?.id) {
    return apiError("PROFILE_NOT_FOUND", "User profile not found.", 404);
  }

  const notificationReader =
    hasSupabaseServiceRole() ? createAdminClient() : supabase;
  const { data: notification, error: notificationError } = await notificationReader
    .from("notifications")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (notificationError || !notification) {
    return apiError(
      "SUPABASE_ERROR",
      notificationError?.message ?? "Notification not found.",
      404,
      notificationError,
    );
  }

  if (notification.user_id !== profile.id && !hasSupabaseServiceRole()) {
    return apiError("FORBIDDEN", "You cannot update this notification.", 403);
  }

  const writer = hasSupabaseServiceRole() ? createAdminClient() : supabase;
  const { error } = await writer
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  if (error) {
    return apiError("SUPABASE_ERROR", error.message, 500, error);
  }

  await writeAuditLog({
    action: "mark_read",
    module: "notifications",
    newValue: {
      id,
      read: true,
      userId: notification.user_id,
    },
  });

  return ok({ id, read: true }, { mode: "supabase" });
}
