import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { writeAuditLog } from "@/lib/supabase/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteProps = {
  params: Promise<{ id: string }>;
};

const updatePricingRuleSchema = z.object({
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

export async function PATCH(request: Request, { params }: RouteProps) {
  const auth = await requireApiRole(["super_admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updatePricingRuleSchema.safeParse(body);

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
  const { data: previousRule } = await supabase
    .from("pricing_rules")
    .select("id, shipment_type, charge_type, minimum_value, maximum_value, price, currency")
    .eq("id", id)
    .maybeSingle();
  const { data, error } = await supabase
    .from("pricing_rules")
    .update({
      charge_type: parsed.data.chargeType,
      currency: parsed.data.currency.toUpperCase(),
      maximum_value: parsed.data.maximumValue ?? null,
      minimum_value: parsed.data.minimumValue,
      price: parsed.data.price,
      shipment_type: parsed.data.shipmentType,
    })
    .eq("id", id)
    .select("id")
    .single();

  if (error || !data) {
    return apiError(
      "SUPABASE_ERROR",
      error?.message ?? "Failed to update pricing rule.",
      500,
      error,
    );
  }

  await writeAuditLog({
    action: "update",
    module: "pricing_rules",
    newValue: {
      currency: parsed.data.currency,
      chargeType: parsed.data.chargeType,
      id: data.id,
      maximumValue: parsed.data.maximumValue ?? null,
      minimumValue: parsed.data.minimumValue,
      price: parsed.data.price,
      shipmentType: parsed.data.shipmentType,
    },
    oldValue: previousRule,
  });

  return ok({ id: data.id, ...parsed.data }, { mode: "supabase" });
}

export async function DELETE(_: Request, { params }: RouteProps) {
  const auth = await requireApiRole(["super_admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const { data: previousRule } = await supabase
    .from("pricing_rules")
    .select("id, shipment_type, charge_type, minimum_value, maximum_value, price, currency")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("pricing_rules").delete().eq("id", id);

  if (error) {
    return apiError("SUPABASE_ERROR", error.message, 500, error);
  }

  await writeAuditLog({
    action: "delete",
    module: "pricing_rules",
    oldValue: previousRule ?? { id },
  });

  return ok({ id, status: "deleted" }, { mode: "supabase" });
}
