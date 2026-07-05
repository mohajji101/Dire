import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCustomerNotification } from "@/lib/supabase/notifications";
import { listPayments } from "@/lib/supabase/dire-data";
import { createClient } from "@/lib/supabase/server";

const createPaymentSchema = z.object({
  invoiceId: z.string().min(3),
  paymentMethod: z.enum(["cash", "bank_transfer", "mobile_money", "card"]),
  amount: z.number().positive(),
  currency: z.string().trim().min(3).max(10).transform((value) => value.toUpperCase()),
  referenceNumber: z.string().min(2),
  paymentDate: z.string().min(8),
});

export async function GET() {
  const { items, mode } = await listPayments();
  return ok(items, { count: items.length, mode });
}

export async function POST(request: Request) {
  const auth = await requireApiRole(["super_admin", "finance"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const currencyCode = parsed.data.currency;

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const { data: invoiceRow, error: invoiceError } = await supabase
    .from("invoices")
    .select("id, total_amount, status, customer_id, invoice_number")
    .eq("id", parsed.data.invoiceId)
    .single();

  if (invoiceError || !invoiceRow) {
    return apiError(
      "SUPABASE_ERROR",
      invoiceError?.message ?? "Invoice was not found.",
      invoiceError?.code === "42501" ? 403 : invoiceError ? 500 : 404,
      invoiceError,
    );
  }

  const { data: existingPaymentRows, error: existingPaymentsError } = await supabase
    .from("payments")
    .select("amount")
    .eq("invoice_id", parsed.data.invoiceId);

  if (existingPaymentsError) {
    return apiError(
      "SUPABASE_ERROR",
      existingPaymentsError.code === "42501"
        ? "Existing payment verification was blocked by Supabase RLS. Run the updated invoice and payment policies from supabase/rls_setup.sql."
        : existingPaymentsError.message,
      existingPaymentsError.code === "42501" ? 403 : 500,
      existingPaymentsError,
    );
  }

  const existingPaidAmount = (existingPaymentRows ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount ?? 0),
    0,
  );
  const invoiceTotalAmount = Number(invoiceRow.total_amount ?? 0);
  const remainingBalance = Math.max(invoiceTotalAmount - existingPaidAmount, 0);

  if (remainingBalance <= 0) {
    return apiError(
      "VALIDATION_ERROR",
      "This invoice is already fully paid. No additional payment can be recorded.",
      422,
      {
        existingPaidAmount,
        invoiceTotalAmount,
        remainingBalance,
      },
    );
  }

  if (parsed.data.amount > remainingBalance) {
    return apiError(
      "VALIDATION_ERROR",
      `Payment exceeds the remaining balance. Remaining balance is ${remainingBalance.toFixed(2)} ${currencyCode}.`,
      422,
      {
        existingPaidAmount,
        invoiceTotalAmount,
        remainingBalance,
      },
    );
  }

  const { data, error } = await supabase
    .from("payments")
    .insert({
      amount: parsed.data.amount,
      currency: currencyCode,
      invoice_id: parsed.data.invoiceId,
      payment_date: parsed.data.paymentDate,
      payment_method: parsed.data.paymentMethod,
      reference_number: parsed.data.referenceNumber,
    })
    .select("*")
    .single();

  if (error || !data) {
    return apiError(
      "SUPABASE_ERROR",
      error?.message?.includes("row-level security")
        ? "Payment insert was blocked by Supabase RLS. Run the updated invoice and payment policies from supabase/rls_setup.sql."
        : error?.message ?? "Failed to create payment.",
      500,
      error,
    );
  }

  const { data: paymentRows, error: paymentRowsError } = await supabase
    .from("payments")
    .select("amount")
    .eq("invoice_id", parsed.data.invoiceId);

  if (paymentRowsError) {
    await supabase.from("payments").delete().eq("id", data.id);
    return apiError(
      "SUPABASE_ERROR",
      paymentRowsError.code === "42501"
        ? "Payment verification was blocked by Supabase RLS. Run the updated invoice and payment policies from supabase/rls_setup.sql."
        : paymentRowsError.message,
      paymentRowsError.code === "42501" ? 403 : 500,
      paymentRowsError,
    );
  }

  const paidAmount = (paymentRows ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount ?? 0),
    0,
  );
  const nextInvoiceStatus =
    paidAmount >= Number(invoiceRow.total_amount ?? 0) ? "paid" : "pending";
  const { error: invoiceUpdateError } = await supabase
    .from("invoices")
    .update({ status: nextInvoiceStatus })
    .eq("id", parsed.data.invoiceId);

  if (invoiceUpdateError) {
    await supabase.from("payments").delete().eq("id", data.id);
    return apiError(
      "SUPABASE_ERROR",
      invoiceUpdateError.code === "42501"
        ? "Invoice status update was blocked by Supabase RLS. Run the updated invoice and payment policies from supabase/rls_setup.sql."
        : invoiceUpdateError.message,
      invoiceUpdateError.code === "42501" ? 403 : 500,
      invoiceUpdateError,
    );
  }

  await sendCustomerNotification({
    customerId: invoiceRow.customer_id,
    message:
      nextInvoiceStatus === "paid"
        ? `Payment received for invoice ${invoiceRow.invoice_number}. Your balance is now fully settled.`
        : `Payment of ${currencyCode} ${parsed.data.amount.toFixed(2)} was recorded for invoice ${invoiceRow.invoice_number}. Remaining balance: ${currencyCode} ${(invoiceTotalAmount - paidAmount).toFixed(2)}.`,
    title: nextInvoiceStatus === "paid" ? "Invoice Fully Paid" : "Payment Recorded",
    type: nextInvoiceStatus === "paid" ? "invoice_paid" : "payment_recorded",
  });

  return ok(
    {
      id: data.id,
      event: "invoice_paid",
      invoiceStatus: nextInvoiceStatus,
      paidAmount,
      ...parsed.data,
      currency: currencyCode,
    },
    { mode: "supabase" },
  );
}
