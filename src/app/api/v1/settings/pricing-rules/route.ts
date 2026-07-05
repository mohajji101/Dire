import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { writeAuditLog } from "@/lib/supabase/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const pricingRuleSchema = z.object({
  chargeType: z.enum([
    "freight",
    "minimum_charge",
    "handling_fee",
    "customs_fee",
    "delivery_fee",
  ]),
  currency: z.string().min(3).max(3),
  maximumValue: z.coerce.number().nonnegative().nullable().optional(),
  minimumValue: z.coerce.number().nonnegative(),
  price: z.coerce.number().nonnegative(),
  shipmentType: z.enum(["AIR", "SEA", "BUY_AND_SHIP"]),
});

export async function POST(request: Request) {
  const auth = await requireApiRole(["super_admin"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = pricingRuleSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  if (
    parsed.data.maximumValue !== null &&
    parsed.data.maximumValue !== undefined &&
    parsed.data.maximumValue < parsed.data.minimumValue
  ) {
    return apiError(
      "INVALID_RANGE",
      "Maximum value must be greater than or equal to minimum value.",
      400,
    );
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const { data, error } = await supabase
    .from("pricing_rules")
    .insert({
      charge_type: parsed.data.chargeType,
      currency: parsed.data.currency.toUpperCase(),
      maximum_value: parsed.data.maximumValue ?? null,
      minimum_value: parsed.data.minimumValue,
      price: parsed.data.price,
      shipment_type: parsed.data.shipmentType,
    })
    .select("id, shipment_type, charge_type, minimum_value, maximum_value, price, currency")
    .single();

  if (error || !data) {
    return apiError(
      "SUPABASE_ERROR",
      error?.message ?? "Failed to save pricing rule.",
      500,
      error,
    );
  }

  await writeAuditLog({
    action: "create",
    module: "pricing_rules",
    newValue: {
      currency: data.currency,
      chargeType: data.charge_type,
      id: data.id,
      maximumValue: data.maximum_value,
      minimumValue: data.minimum_value,
      price: data.price,
      shipmentType: data.shipment_type,
    },
  });

  return ok(
    {
      currency: data.currency,
      chargeType: data.charge_type,
      id: data.id,
      maximumValue: data.maximum_value,
      minimumValue: data.minimum_value,
      price: data.price,
      shipmentType: data.shipment_type,
    },
    { mode: "supabase" },
  );
}
