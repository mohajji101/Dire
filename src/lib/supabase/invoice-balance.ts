import type { SupabaseClient } from "@supabase/supabase-js";

export type ShipmentInvoiceSummary = {
  balanceDue: number;
  currency: string;
  hasInvoice: boolean;
  invoiceCount: number;
  invoiceId: string | null;
  invoiceNumber: string | null;
  paidAmount: number;
  paymentStatus: "paid" | "pending" | "unbilled";
  totalAmount: number;
};

export async function getShipmentInvoiceSummary(
  supabase: SupabaseClient,
  shipmentId: string,
): Promise<ShipmentInvoiceSummary> {
  const { data: invoiceRows, error: invoiceError } = await supabase
    .from("invoices")
    .select("id, invoice_number, currency, total_amount")
    .eq("shipment_id", shipmentId)
    .order("created_at", { ascending: false });

  if (invoiceError || !invoiceRows?.length) {
    return {
      balanceDue: 0,
      currency: "USD",
      hasInvoice: false,
      invoiceCount: 0,
      invoiceId: null,
      invoiceNumber: null,
      paidAmount: 0,
      paymentStatus: "unbilled",
      totalAmount: 0,
    };
  }

  const invoiceIds = invoiceRows.map((row) => row.id);
  const { data: paymentRows } = await supabase
    .from("payments")
    .select("invoice_id, amount")
    .in("invoice_id", invoiceIds);

  const paidByInvoiceId = new Map<string, number>();
  for (const payment of paymentRows ?? []) {
    paidByInvoiceId.set(
      payment.invoice_id,
      (paidByInvoiceId.get(payment.invoice_id) ?? 0) + Number(payment.amount ?? 0),
    );
  }

  const totalAmount = invoiceRows.reduce(
    (sum, row) => sum + Number(row.total_amount ?? 0),
    0,
  );
  const paidAmount = invoiceRows.reduce(
    (sum, row) => sum + (paidByInvoiceId.get(row.id) ?? 0),
    0,
  );
  const latestInvoice = invoiceRows[0];

  return {
    balanceDue: Math.max(totalAmount - paidAmount, 0),
    currency: String(latestInvoice.currency ?? "USD").toUpperCase(),
    hasInvoice: true,
    invoiceCount: invoiceRows.length,
    invoiceId: latestInvoice.id,
    invoiceNumber: latestInvoice.invoice_number ?? null,
    paidAmount,
    paymentStatus: totalAmount - paidAmount <= 0 ? "paid" : "pending",
    totalAmount,
  };
}
