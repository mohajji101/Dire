import { hasSupabaseEnv, hasSupabaseServiceRole } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type NotificationInput = {
  message: string;
  title: string;
  type: string;
  userId: string;
};

async function getNotificationWriter() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  if (hasSupabaseServiceRole()) {
    return createAdminClient();
  }

  return createClient();
}

export async function sendSystemNotification(input: NotificationInput) {
  const writer = await getNotificationWriter();
  if (!writer) {
    return;
  }

  const { error } = await writer.from("notifications").insert({
    message: input.message,
    title: input.title,
    type: input.type,
    user_id: input.userId,
  });

  if (error) {
    console.error("Failed to send system notification", {
      message: error.message,
      title: input.title,
      type: input.type,
      userId: input.userId,
    });
  }
}

export async function sendCustomerNotification(params: {
  customerId: string;
  message: string;
  title: string;
  type: string;
}) {
  const writer = await getNotificationWriter();
  if (!writer) {
    return;
  }

  const { data: customerRow, error: customerError } = await writer
    .from("customers")
    .select("user_id")
    .eq("id", params.customerId)
    .maybeSingle();

  if (customerError || !customerRow?.user_id) {
    return;
  }

  await sendSystemNotification({
    message: params.message,
    title: params.title,
    type: params.type,
    userId: customerRow.user_id,
  });
}
