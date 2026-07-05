import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { getCurrentCustomerId, requireApiRole } from "@/lib/api-auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupportTicketDetail } from "@/lib/supabase/dire-data";
import { createClient } from "@/lib/supabase/server";

const messageSchema = z.object({
  senderId: z.string().min(2),
  message: z.string().min(1),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireApiRole(["super_admin", "support", "customer"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const ticket = await getSupportTicketDetail(id);

  if (!ticket) {
    return apiError("NOT_FOUND", "Support ticket was not found.", 404);
  }

  const body = await request.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  if (auth.value.role === "customer") {
    const customerResult = await getCurrentCustomerId(auth.value.profileId!);
    if (!customerResult.ok) {
      return customerResult.response;
    }

    if (ticket.ticket.customerId !== customerResult.customerId) {
      return apiError(
        "FORBIDDEN",
        "You can only reply to your own support tickets.",
        403,
      );
    }
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const { data, error } = await supabase
    .from("ticket_messages")
    .insert({
      message: parsed.data.message,
      sender_id: parsed.data.senderId,
      ticket_id: id,
    })
    .select("*")
    .single();

  if (error || !data) {
    return apiError(
      "SUPABASE_ERROR",
      error?.message?.includes("row-level security")
        ? "Support message insert was blocked by Supabase RLS. Run the updated support policies from supabase/rls_setup.sql."
        : error?.message ?? "Failed to create support message.",
      500,
      error,
    );
  }

  return ok(
    {
      id: data.id,
      ticketId: id,
      ...parsed.data,
    },
    { mode: "supabase" },
  );
}
