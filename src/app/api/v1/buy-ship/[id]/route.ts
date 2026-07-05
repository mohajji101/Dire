import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { buyShipRequests } from "@/lib/demo-data";
import { hasSupabaseEnv, hasSupabaseServiceRole } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCustomerNotification } from "@/lib/supabase/notifications";
import { createClient } from "@/lib/supabase/server";
import { getBuyShipDetail } from "@/lib/supabase/dire-data";
import { isBuyShipLocked, validateBuyShipTransition } from "@/lib/workflow-guards";

const updateBuyShipSchema = z.object({
  currency: z.string().trim().min(3).max(10).transform((value) => value.toUpperCase()).optional(),
  estimatedPrice: z.number().nonnegative().optional(),
  pricingBasis: z.enum(["fixed_total", "per_item"]).optional(),
  productName: z.string().min(2).optional(),
  purchaseLink: z.string().url().optional(),
  quantity: z.number().int().positive().optional(),
  unitPrice: z.number().nonnegative().optional(),
  status: z
    .enum([
      "requested",
      "quoted",
      "awaiting_payment",
      "purchased",
      "in_warehouse",
      "converted_to_shipment",
      "cancelled",
    ])
    .optional(),
}).superRefine((value, context) => {
  if (value.pricingBasis === "per_item" && value.unitPrice === undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Unit price is required for per-item pricing.",
      path: ["unitPrice"],
    });
  }
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const detail = await getBuyShipDetail(id);

  if (!detail) {
    return apiError("NOT_FOUND", "Buy & Ship request was not found.", 404);
  }

  return ok(detail, { mode: detail.mode });
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireApiRole(["super_admin", "operations"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateBuyShipSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  if (!hasSupabaseEnv()) {
    const item = buyShipRequests.find((entry) => entry.id === id);

    if (!item) {
      return apiError("NOT_FOUND", "Buy & Ship request was not found.", 404);
    }

    return ok({ ...item, ...parsed.data }, { mode: "demo" });
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const { data: currentRequest, error: currentRequestError } = await supabase
    .from("buy_ship_requests")
    .select("id, customer_id, quantity, pricing_basis, unit_price, estimated_price, currency, status, shipment_id")
    .eq("id", id)
    .single();

  if (currentRequestError || !currentRequest) {
    return apiError(
      "SUPABASE_ERROR",
      currentRequestError?.message ?? "Buy & Ship request was not found.",
      currentRequestError?.code === "42501" ? 403 : currentRequestError ? 500 : 404,
      currentRequestError,
    );
  }

  const nextQuantity = parsed.data.quantity ?? Number(currentRequest.quantity ?? 1);
  const nextPricingBasis = parsed.data.pricingBasis ?? currentRequest.pricing_basis ?? "fixed_total";
  const currentStatus = currentRequest.status ?? "requested";
  const nextStatus = parsed.data.status ?? currentStatus;

  if (isBuyShipLocked(currentStatus)) {
    return apiError(
      "WORKFLOW_ERROR",
      currentStatus === "converted_to_shipment"
        ? "This Buy & Ship request has already been converted to a shipment and can no longer be edited here."
        : "This Buy & Ship request has been cancelled and can no longer be edited.",
      409,
    );
  }

  const transition = validateBuyShipTransition(currentStatus, nextStatus);
  if (!transition.ok) {
    return apiError("WORKFLOW_ERROR", transition.message, 409);
  }

  const nextCurrency = parsed.data.currency ?? String(currentRequest.currency ?? "USD").toUpperCase();

  const nextUnitPrice =
    parsed.data.unitPrice ?? (currentRequest.unit_price === null ? undefined : Number(currentRequest.unit_price));
  const nextEstimatedPrice =
    nextPricingBasis === "per_item"
      ? Number(nextUnitPrice ?? 0) * nextQuantity
      : Number(
          parsed.data.estimatedPrice ??
            (currentRequest.estimated_price === null ? 0 : currentRequest.estimated_price),
        );

  if (
    nextStatus === "awaiting_payment" &&
    nextEstimatedPrice <= 0
  ) {
    return apiError(
      "VALIDATION_ERROR",
      "Set a valid estimate before moving this Buy & Ship request into awaiting payment.",
      422,
    );
  }

  if (
    nextStatus === "converted_to_shipment" &&
    !currentRequest.shipment_id
  ) {
    return apiError(
      "WORKFLOW_ERROR",
      "This request has not been received into warehouse yet, so it cannot be marked as converted to shipment.",
      409,
    );
  }

  const { data, error } = await supabase
    .from("buy_ship_requests")
    .update({
      currency: nextCurrency,
      estimated_price: nextEstimatedPrice,
      pricing_basis: nextPricingBasis,
      product_name: parsed.data.productName,
      purchase_link: parsed.data.purchaseLink,
      quantity: nextQuantity,
      status: nextStatus,
      unit_price: nextPricingBasis === "per_item" ? nextUnitPrice ?? null : null,
    })
    .eq("id", id)
    .select("id")
    .single();

  if (error || !data) {
    return apiError(
      "SUPABASE_ERROR",
      error?.message?.includes("row-level security")
        ? "Buy & Ship update was blocked by Supabase RLS. Run the updated buy_ship_requests policies from supabase/rls_setup.sql."
        : error?.message ?? "Failed to update Buy & Ship request.",
      500,
      error,
    );
  }

  await sendCustomerNotification({
    customerId: currentRequest.customer_id,
    message: `Your Buy & Ship request is now ${nextStatus.replaceAll("_", " ")}.`,
    title: "Buy & Ship Status Updated",
    type: "buy_ship_status_updated",
  });

  return ok(
    {
      id: data.id,
      ...parsed.data,
      currency: nextCurrency,
      estimatedPrice: nextEstimatedPrice,
      pricingBasis: nextPricingBasis,
      quantity: nextQuantity,
      unitPrice: nextPricingBasis === "per_item" ? nextUnitPrice ?? null : null,
    },
    { mode: "supabase" },
  );
}
