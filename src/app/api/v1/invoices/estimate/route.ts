import { apiError, ok } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { calculateShipmentInvoiceEstimate, type ChargeType } from "@/lib/shipment-pricing";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const auth = await requireApiRole(["super_admin", "finance"]);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const shipmentId = url.searchParams.get("shipmentId");

  if (!shipmentId) {
    return apiError("VALIDATION_ERROR", "shipmentId is required.", 400);
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();

  const [{ data: shipmentRow, error: shipmentError }, { data: packageRows, error: packageError }] =
    await Promise.all([
      supabase
        .from("shipments")
        .select("id, shipment_type")
        .eq("id", shipmentId)
        .single(),
      supabase
        .from("shipment_packages")
        .select("weight, volume")
        .eq("shipment_id", shipmentId),
    ]);

  if (shipmentError || !shipmentRow) {
    return apiError(
      "SUPABASE_ERROR",
      shipmentError?.message ?? "Shipment not found.",
      shipmentError?.code === "42501" ? 403 : 404,
      shipmentError,
    );
  }

  if (packageError) {
    return apiError(
      "SUPABASE_ERROR",
      packageError.message,
      packageError.code === "42501" ? 403 : 500,
      packageError,
    );
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
    return apiError(
      "SUPABASE_ERROR",
      pricingError.message,
      pricingError.code === "42501" ? 403 : 500,
      pricingError,
    );
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

  return ok(
    {
      currency: estimate.currency,
      customsFee: estimate.customsFee,
      deliveryFee: estimate.deliveryFee,
      freightAmount: estimate.freightAmount,
      freightRuleFound: estimate.freightRuleFound,
      handlingFee: estimate.handlingFee,
      measurementLabel: estimate.measurementLabel,
      measurementValue: estimate.measurementValue,
      minimumCharge: estimate.minimumCharge,
      minimumChargeApplied: estimate.minimumChargeApplied,
      shipmentType,
      volume: metrics.volume,
      weight: metrics.weight,
    },
    { mode: "supabase" },
  );
}
