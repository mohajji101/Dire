import { z } from "zod";
import { getCurrentCustomerId, requireApiRole } from "@/lib/api-auth";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { normalizeCustomerType } from "@/lib/customer-types";
import { hasSupabaseEnv, hasSupabaseServiceRole } from "@/lib/env";
import { writeAuditLog } from "@/lib/supabase/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomerDetail } from "@/lib/supabase/dire-data";
import { createClient } from "@/lib/supabase/server";

const updateCustomerSchema = z.object({
  address: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  companyName: z.string().optional(),
  country: z.string().min(2).optional(),
  customerType: z.enum(["individual", "business", "government", "ngo"]).optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().min(6).optional(),
  status: z.enum(["active", "pending", "suspended"]).optional(),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const detail = await getCustomerDetail(id);

  if (!detail) {
    return apiError("NOT_FOUND", "Customer was not found.", 404);
  }

  return ok(detail, { mode: detail.mode });
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const auth = await requireApiRole(["super_admin", "operations", "support", "customer"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = updateCustomerSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  if (!hasSupabaseEnv()) {
    return ok({ id, ...parsed.data }, { mode: "demo" });
  }

  if (auth.value.role === "customer") {
    const customerResult = await getCurrentCustomerId(auth.value.profileId!);
    if (!customerResult.ok) return customerResult.response;
    if (customerResult.customerId !== id) {
      return apiError("FORBIDDEN", "You can only update your own customer profile.", 403);
    }
    if (parsed.data.customerType || parsed.data.status) {
      return apiError(
        "FORBIDDEN",
        "Customer type and status can only be changed by staff.",
        403,
      );
    }
  }

  const supabase = hasSupabaseServiceRole() ? createAdminClient() : await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("customers")
    .select("id, user_id, first_name, last_name, company_name, phone, country, city, address, customer_type, status")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return apiError("SUPABASE_ERROR", existingError.message, 500, existingError);
  }

  if (!existing) {
    return apiError("NOT_FOUND", "Customer was not found.", 404);
  }

  const updates = {
    ...(parsed.data.address !== undefined ? { address: parsed.data.address } : {}),
    ...(parsed.data.city !== undefined ? { city: parsed.data.city } : {}),
    ...(parsed.data.companyName !== undefined ? { company_name: parsed.data.companyName || null } : {}),
    ...(parsed.data.country !== undefined ? { country: parsed.data.country } : {}),
    ...(parsed.data.customerType !== undefined
      ? { customer_type: normalizeCustomerType(parsed.data.customerType) }
      : {}),
    ...(parsed.data.firstName !== undefined ? { first_name: parsed.data.firstName } : {}),
    ...(parsed.data.lastName !== undefined ? { last_name: parsed.data.lastName } : {}),
    ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
    ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
  };

  const { data: updated, error } = await supabase
    .from("customers")
    .update(updates)
    .eq("id", id)
    .select("id, user_id, first_name, last_name, company_name, phone, country, city, address, customer_type, status")
    .single();

  if (error || !updated) {
    return apiError("SUPABASE_ERROR", error?.message ?? "Customer update failed.", 500, error);
  }

  if (parsed.data.phone !== undefined && updated.user_id) {
    await supabase.from("users").update({ phone: parsed.data.phone }).eq("id", updated.user_id);
  }

  await writeAuditLog({
    action: "update_customer_profile",
    module: "customers",
    oldValue: existing,
    newValue: updated,
  });

  return ok(updated, { mode: "supabase" });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const auth = await requireApiRole(["super_admin", "operations"]);
  if (!auth.ok) return auth.response;

  const supabase = hasSupabaseServiceRole() ? createAdminClient() : await createClient();
  const { data: existing } = await supabase
    .from("customers")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    return apiError("NOT_FOUND", "Customer was not found.", 404);
  }

  const { error } = await supabase
    .from("customers")
    .update({ status: "suspended" })
    .eq("id", id);

  if (error) {
    return apiError("SUPABASE_ERROR", error.message, 500, error);
  }

  await writeAuditLog({
    action: "suspend_customer",
    module: "customers",
    oldValue: existing,
    newValue: { id, status: "suspended" },
  });

  return ok({ id, status: "suspended" }, { mode: "supabase" });
}
