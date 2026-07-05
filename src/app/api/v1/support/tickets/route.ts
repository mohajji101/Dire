import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { getCurrentCustomerId, requireApiRole } from "@/lib/api-auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { listSupportTickets } from "@/lib/supabase/dire-data";
import { createClient } from "@/lib/supabase/server";

const createTicketSchema = z.object({
  customerId: z.string().min(3),
  subject: z.string().min(3),
  message: z.string().min(3),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const priority = url.searchParams.get("priority");
  const customerId = url.searchParams.get("customerId");
  const { items, mode } = await listSupportTickets({
    customerId,
    priority,
    status,
  });

  return ok(items, { count: items.length, mode });
}

export async function POST(request: Request) {
  const auth = await requireApiRole(["super_admin", "support", "customer"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createTicketSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  if (auth.value.role === "customer") {
    const customerResult = await getCurrentCustomerId(auth.value.profileId!);
    if (!customerResult.ok) {
      return customerResult.response;
    }

    if (parsed.data.customerId !== customerResult.customerId) {
      return apiError(
        "FORBIDDEN",
        "You can only create support tickets for your own customer account.",
        403,
      );
    }
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`;
  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      customer_id: parsed.data.customerId,
      message: parsed.data.message,
      priority: parsed.data.priority,
      status: "open",
      subject: parsed.data.subject,
      ticket_number: ticketNumber,
    })
    .select("*")
    .single();

  if (error || !data) {
    return apiError(
      "SUPABASE_ERROR",
      error?.message?.includes("row-level security")
        ? "Support ticket insert was blocked by Supabase RLS. Run the updated support policies from supabase/rls_setup.sql."
        : error?.message ?? "Failed to create support ticket.",
      500,
      error,
    );
  }

  return ok(
    {
      id: data.id,
      ticketNumber,
      status: "open",
      event: "new_support_ticket",
      ...parsed.data,
    },
    { mode: "supabase" },
  );
}
