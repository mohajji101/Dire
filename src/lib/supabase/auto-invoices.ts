import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateShipmentInvoiceEstimate, type ChargeType } from "@/lib/shipment-pricing";
import { sendCustomerNotification } from "@/lib/supabase/notifications";

function buildInvoiceNumber() {
  return `INV-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0")}`;
}

export async function ensureShipmentInvoiceForFinalStage(
  supabase: SupabaseClient,
  shipmentId: string,
) {
  const { data: existingInvoices, error: existingInvoiceError } = await supabase
    .from("invoices")
    .select("id, invoice_number, status")
    .eq("shipment_id", shipmentId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (existingInvoiceError) {
    return {
      error: existingInvoiceError.message,
      ok: false as const,
    };
  }

  if (existingInvoices?.length) {
    return {
      created: false,
      id: existingInvoices[0].id,
      invoiceNumber: existingInvoices[0].invoice_number,
      ok: true as const,
    };
  }

  const [{ data: shipmentRow, error: shipmentError }, { data: packageRows, error: packageError }] =
    await Promise.all([
      supabase
        .from("shipments")
        .select("id, customer_id, shipment_type, tracking_number")
        .eq("id", shipmentId)
        .single(),
      supabase
        .from("shipment_packages")
        .select("weight, volume")
        .eq("shipment_id", shipmentId),
    ]);

  if (shipmentError || !shipmentRow) {
    return {
      error: shipmentError?.message ?? "Shipment not found.",
      ok: false as const,
    };
  }

  if (packageError) {
    return {
      error: packageError.message,
      ok: false as const,
    };
  }

  const shipmentType =
    shipmentRow.shipment_type === "SEA"
      ? "SEA"
      : shipmentRow.shipment_type === "BUY_AND_SHIP"
        ? "BUY_AND_SHIP"
        : "AIR";

  const { data: pricingRows, error: pricingError } = await supabase
    .from("pricing_rules")
    .select("shipment_type, charge_type, minimum_value, maximum_value, price, currency")
    .eq("shipment_type", shipmentType);

  if (pricingError) {
    return {
      error: pricingError.message,
      ok: false as const,
    };
  }

  const metrics = (packageRows ?? []).reduce(
    (sum, pkg) => ({
      volume: sum.volume + Number(pkg.volume ?? 0),
      weight: sum.weight + Number(pkg.weight ?? 0),
    }),
    { volume: 0, weight: 0 },
  );

  const estimate = calculateShipmentInvoiceEstimate({
    pricingRules: (pricingRows ?? []).map((row) => ({
      chargeType:
        row.charge_type === "minimum_charge" ||
        row.charge_type === "handling_fee" ||
        row.charge_type === "customs_fee" ||
        row.charge_type === "delivery_fee"
          ? (row.charge_type as ChargeType)
          : "freight",
      currency: String(row.currency ?? "USD").toUpperCase(),
      maximumValue:
        row.maximum_value === null || row.maximum_value === undefined
          ? null
          : Number(row.maximum_value),
      minimumValue: Number(row.minimum_value ?? 0),
      price: Number(row.price ?? 0),
      shipmentType,
    })),
    shipmentType,
    volume: metrics.volume,
    weight: metrics.weight,
  });

  const totalAmount =
    estimate.freightAmount + estimate.handlingFee + estimate.deliveryFee + estimate.customsFee;

  if (!estimate.freightRuleFound && totalAmount <= 0) {
    return {
      error:
        "No pricing rules were found for this shipment. Add pricing rules or create the invoice manually before final handoff.",
      ok: false as const,
    };
  }

  let createdInvoice:
    | { id: string; invoice_number: string; total_amount: number; currency: string }
    | null = null;
  let createError: string | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const invoiceNumber = buildInvoiceNumber();
    const insertResponse = await supabase
      .from("invoices")
      .insert({
        currency: estimate.currency,
        customer_id: shipmentRow.customer_id,
        customs_fee: estimate.customsFee,
        customs_fee_mode: "included_in_invoice",
        delivery_fee: estimate.deliveryFee,
        handling_fee: estimate.handlingFee,
        invoice_number: invoiceNumber,
        minimum_charge_applied: estimate.minimumChargeApplied,
        service_fee: 0,
        shipment_id: shipmentId,
        status: totalAmount > 0 ? "pending" : "paid",
        subtotal: estimate.freightAmount,
        total_amount: totalAmount,
      })
      .select("id, invoice_number, total_amount, currency")
      .single();

    if (!insertResponse.error && insertResponse.data) {
      createdInvoice = insertResponse.data;
      createError = null;
      break;
    }

    createError = insertResponse.error?.message ?? "Failed to auto-create shipment invoice.";

    if (insertResponse.error?.code !== "23505") {
      break;
    }
  }

  if (!createdInvoice) {
    return {
      error: createError ?? "Failed to auto-create shipment invoice.",
      ok: false as const,
    };
  }

  await sendCustomerNotification({
    customerId: shipmentRow.customer_id,
    message: `Invoice ${createdInvoice.invoice_number} was generated automatically for shipment ${shipmentRow.tracking_number ?? shipmentId}.`,
    title: "Shipment Invoice Ready",
    type: "invoice_created",
  });

  return {
    created: true,
    id: createdInvoice.id,
    invoiceNumber: createdInvoice.invoice_number,
    ok: true as const,
  };
}
