import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { supportTickets, type SupportTicket } from "@/lib/demo-data";
import { hasSupabaseEnv, hasSupabaseServiceRole } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSupportTicketDetail } from "@/lib/supabase/dire-data";
import { isSupportLocked, validateSupportTransition } from "@/lib/workflow-guards";

const updateTicketSchema = z.object({
  status: z.enum(["open", "waiting_customer", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const detail = await getSupportTicketDetail(id);

  if (!detail) {
    return apiError("NOT_FOUND", "Support ticket was not found.", 404);
  }

  return ok(detail, { mode: detail.mode });
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireApiRole(["super_admin", "support"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateTicketSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  if (!hasSupabaseEnv()) {
    const ticket = supportTickets.find((item) => item.id === id);

    if (!ticket) {
      return apiError("NOT_FOUND", "Support ticket was not found.", 404);
    }

    return ok({ ...ticket, ...parsed.data }, { mode: "demo" });
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const { data: currentTicket, error: currentTicketError } = await supabase
    .from("support_tickets")
    .select("id, status, priority, customer_id")
    .eq("id", id)
    .single();

  if (currentTicketError || !currentTicket) {
    return apiError(
      "SUPABASE_ERROR",
      currentTicketError?.message ?? "Support ticket was not found.",
      currentTicketError?.code === "42501" ? 403 : currentTicketError ? 500 : 404,
      currentTicketError,
    );
  }

  const currentStatus = (currentTicket.status ?? "open") as SupportTicket["status"];
  const nextStatus = (parsed.data.status ?? currentStatus) as SupportTicket["status"];

  if (isSupportLocked(currentStatus)) {
    return apiError(
      "WORKFLOW_ERROR",
      "This support ticket is already closed and can no longer be edited.",
      409,
    );
  }

  const transition = validateSupportTransition(currentStatus, nextStatus);
  if (!transition.ok) {
    return apiError("WORKFLOW_ERROR", transition.message, 409);
  }

  const { data, error } = await supabase
    .from("support_tickets")
    .update({
      priority: parsed.data.priority ?? undefined,
      status: nextStatus,
    })
    .eq("id", id)
    .select("id, status, priority")
    .single();

  if (error || !data) {
    return apiError(
      "SUPABASE_ERROR",
      error?.message?.includes("row-level security")
        ? "Support ticket update was blocked by Supabase RLS. Run the updated support policies from supabase/rls_setup.sql."
        : error?.message ?? "Failed to update support ticket.",
      error?.code === "42501" ? 403 : error ? 500 : 404,
      error,
    );
  }

  return ok(
    {
      assignedTo: "Support Desk",
      id: data.id,
      priority: data.priority ?? "normal",
      status: data.status ?? "open",
    },
    { mode: "supabase" },
  );
}
