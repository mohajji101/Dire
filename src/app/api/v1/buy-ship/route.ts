import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { getCurrentCustomerId, requireApiRole } from "@/lib/api-auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCustomerNotification } from "@/lib/supabase/notifications";
import { listBuyShipRequests } from "@/lib/supabase/dire-data";
import { createClient } from "@/lib/supabase/server";

const createBuyShipSchema = z.object({
  customerId: z.string().min(3),
  productName: z.string().min(2),
  purchaseLink: z.string().url(),
  quantity: z.number().int().positive(),
  estimatedPrice: z.number().nonnegative().optional(),
  currency: z.string().trim().min(3).max(10).transform((value) => value.toUpperCase()).default("USD"),
  pricingBasis: z.enum(["fixed_total", "per_item"]).default("fixed_total"),
  unitPrice: z.number().nonnegative().optional(),
}).superRefine((value, context) => {
  if (value.pricingBasis === "per_item" && value.unitPrice === undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Unit price is required for per-item pricing.",
      path: ["unitPrice"],
    });
  }

  if (value.pricingBasis === "fixed_total" && value.estimatedPrice === undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Estimated total is required for fixed-total pricing.",
      path: ["estimatedPrice"],
    });
  }
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const customerId = url.searchParams.get("customerId");
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");
  const { items, mode } = await listBuyShipRequests({ customerId, search, status });
  return ok(items, { count: items.length, mode });
}

export async function POST(request: Request) {
  const auth = await requireApiRole(["super_admin", "operations", "customer"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createBuyShipSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const currencyCode = parsed.data.currency.toUpperCase();

  if (auth.value.role === "customer") {
    const customerResult = await getCurrentCustomerId(auth.value.profileId!);
    if (!customerResult.ok) {
      return customerResult.response;
    }

    if (parsed.data.customerId !== customerResult.customerId) {
      return apiError(
        "FORBIDDEN",
        "You can only create Buy & Ship requests for your own customer account.",
        403,
      );
    }
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const estimatedPrice =
    parsed.data.pricingBasis === "per_item"
      ? Number(parsed.data.unitPrice ?? 0) * parsed.data.quantity
      : Number(parsed.data.estimatedPrice ?? 0);
  const { data, error } = await supabase
    .from("buy_ship_requests")
    .insert({
      customer_id: parsed.data.customerId,
      currency: currencyCode,
      estimated_price: estimatedPrice,
      pricing_basis: parsed.data.pricingBasis,
      product_name: parsed.data.productName,
      purchase_link: parsed.data.purchaseLink,
      quantity: parsed.data.quantity,
      status: "requested",
      unit_price: parsed.data.unitPrice ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return apiError(
      "SUPABASE_ERROR",
      error?.message?.includes("row-level security")
        ? "Buy & Ship request insert was blocked by Supabase RLS. Run the updated buy_ship_requests policies from supabase/rls_setup.sql."
        : error?.message ?? "Failed to create Buy & Ship request.",
      500,
      error,
    );
  }

  await sendCustomerNotification({
    customerId: parsed.data.customerId,
    message: `Your Buy & Ship request ${`BS-${data.id.replaceAll("-", "").slice(0, 8).toUpperCase()}`} for ${parsed.data.productName} has been created.`,
    title: "Buy & Ship Request Created",
    type: "buy_ship_created",
  });

  return ok(
    {
      id: data.id,
      requestNumber: `BS-${data.id.replaceAll("-", "").slice(0, 8).toUpperCase()}`,
      status: "requested",
      paymentStatus: "not_required",
      ...parsed.data,
      currency: currencyCode,
      estimatedPrice,
    },
    { mode: "supabase" },
  );
}
