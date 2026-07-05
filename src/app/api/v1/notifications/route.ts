import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { writeAuditLog } from "@/lib/supabase/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { getNotificationCenterData } from "@/lib/supabase/dire-data";
import { createClient } from "@/lib/supabase/server";

const sendNotificationSchema = z.object({
  message: z.string().min(3),
  title: z.string().min(2),
  type: z.string().min(2),
  userId: z.string().uuid(),
});

export async function GET() {
  const notifications = await getNotificationCenterData();
  return ok(notifications.items, {
    mode: notifications.mode,
    unreadCount: notifications.unreadCount,
  });
}

export async function POST(request: Request) {
  const auth = await requireApiRole(["super_admin", "operations", "warehouse", "finance", "support"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = sendNotificationSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const { data: targetUser } = await supabase
    .from("users")
    .select("id, email")
    .eq("id", parsed.data.userId)
    .maybeSingle();
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      message: parsed.data.message,
      title: parsed.data.title,
      type: parsed.data.type,
      user_id: parsed.data.userId,
    })
    .select("id, user_id, title, message, type, is_read, created_at")
    .single();

  if (error || !data) {
    return apiError(
      "SUPABASE_ERROR",
      error?.message?.includes("row-level security")
        ? "Notification insert was blocked by Supabase RLS. Run the latest notification policies from supabase/rls_setup.sql, or add SUPABASE_SERVICE_ROLE_KEY so admin notification writes can use the service client."
        : error?.message ?? "Failed to send notification.",
      500,
      error,
    );
  }

  await writeAuditLog({
    action: "send",
    module: "notifications",
    newValue: {
      id: data.id,
      message: data.message,
      targetUserEmail: targetUser?.email ?? "unknown@direcargo.com",
      targetUserId: data.user_id,
      title: data.title,
      type: data.type,
    },
  });

  return ok(
    {
      createdAt: data.created_at,
      id: data.id,
      message: data.message,
      read: data.is_read,
      title: data.title,
      type: data.type,
      userId: data.user_id,
    },
    { mode: "supabase" },
  );
}
