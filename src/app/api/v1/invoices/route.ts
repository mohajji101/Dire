import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCustomerNotification } from "@/lib/supabase/notifications";
import { listInvoices } from "@/lib/supabase/dire-data";
import { createClient } from "@/lib/supabase/server";

const createInvoiceSchema = z.object({
  customerId: z.string().min(3),
  customsFee: z.number().nonnegative().optional().default(0),
  customsFeeMode: z.enum(["included_in_invoice", "paid_directly_by_customer"]).optional().default("included_in_invoice"),
  shipmentId: z.string().min(3).optional(),
  deliveryFee: z.number().nonnegative().optional().default(0),
  currency: z.string().trim().min(3).max(10).transform((value) => value.toUpperCase()),
  handlingFee: z.number().nonnegative().optional().default(0),
  minimumChargeApplied: z.boolean().optional().default(false),
  subtotal: z.number().nonnegative(),
  serviceFee: z.number().nonnegative(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const customerId = url.searchParams.get("customerId");
  const currency = url.searchParams.get("currency");
  const { items, mode, paidCount } = await listInvoices({
    currency,
    customerId,
    status,
  });
  return ok(items, { count: items.length, paidCount, mode });
}

export async function POST(request: Request) {
  const auth = await requireApiRole(["super_admin", "finance"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createInvoiceSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const includedCustomsFee =
    parsed.data.customsFeeMode === "included_in_invoice" ? parsed.data.customsFee : 0;
  const totalAmount =
    parsed.data.subtotal +
    parsed.data.serviceFee +
    parsed.data.handlingFee +
    parsed.data.deliveryFee +
    includedCustomsFee;
  const initialStatus = totalAmount > 0 ? "pending" : "paid";
  let data: { id: string } | null = null;
  let invoiceNumber = "";
  let error: { code?: string; message: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    invoiceNumber = `INV-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0")}`;
    const insertResponse = await supabase
      .from("invoices")
      .insert({
        currency: parsed.data.currency,
        customs_fee: parsed.data.customsFee,
        customs_fee_mode: parsed.data.customsFeeMode,
        customer_id: parsed.data.customerId,
        delivery_fee: parsed.data.deliveryFee,
        handling_fee: parsed.data.handlingFee,
        invoice_number: invoiceNumber,
        minimum_charge_applied: parsed.data.minimumChargeApplied,
        service_fee: parsed.data.serviceFee,
        shipment_id: parsed.data.shipmentId ?? null,
        status: initialStatus,
        subtotal: parsed.data.subtotal,
        total_amount: totalAmount,
      })
      .select("id")
      .single();

    if (!insertResponse.error && insertResponse.data) {
      data = insertResponse.data;
      error = null;
      break;
    }

    error = {
      code: insertResponse.error?.code,
      message: insertResponse.error?.message ?? "Failed to create invoice.",
    };

    if (insertResponse.error?.code !== "23505") {
      break;
    }
  }

  if (error || !data) {
    return apiError(
      "SUPABASE_ERROR",
      error?.message?.includes("row-level security")
        ? "Invoice insert was blocked by Supabase RLS. Run the updated invoice and payment policies from supabase/rls_setup.sql."
        : error?.message ?? "Failed to create invoice.",
      error?.code === "42501" ? 403 : 500,
      error,
    );
  }

  await sendCustomerNotification({
    customerId: parsed.data.customerId,
    message: `A new invoice ${invoiceNumber} for ${parsed.data.currency} ${totalAmount.toFixed(2)} is ready in your account.`,
    title: "New Invoice Created",
    type: "invoice_created",
  });

  return ok(
    {
      id: data.id,
      invoiceNumber,
      status: initialStatus,
      totalAmount,
      ...parsed.data,
    },
    { mode: "supabase" },
  );
}
