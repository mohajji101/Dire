import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { writeAuditLog } from "@/lib/supabase/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const updateBranchSchema = z.object({
  branchType: z.enum(["HQ", "Office", "Warehouse"]),
  city: z.string().min(2),
  country: z.string().min(2),
  name: z.string().min(2),
  status: z.enum(["active", "inactive"]),
});

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteProps) {
  const auth = await requireApiRole(["super_admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateBranchSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const { data: previousBranch } = await supabase
    .from("branches")
    .select("id, name, country, city, branch_type, status")
    .eq("id", id)
    .maybeSingle();
  const { data, error } = await supabase
    .from("branches")
    .update({
      branch_type: parsed.data.branchType,
      city: parsed.data.city,
      country: parsed.data.country,
      name: parsed.data.name,
      status: parsed.data.status,
    })
    .eq("id", id)
    .select("id, name, country, city, branch_type, status")
    .single();

  if (error || !data) {
    return apiError(
      "SUPABASE_ERROR",
      error?.message ?? "Failed to update branch.",
      500,
      error,
    );
  }

  await writeAuditLog({
    action: "update",
    module: "branches",
    newValue: {
      branchType: data.branch_type,
      city: data.city,
      country: data.country,
      id: data.id,
      name: data.name,
      status: data.status,
    },
    oldValue: previousBranch,
  });

  return ok(
    {
      branchType: data.branch_type,
      city: data.city,
      country: data.country,
      id: data.id,
      name: data.name,
      status: data.status,
    },
    { mode: "supabase" },
  );
}

export async function DELETE(_: Request, { params }: RouteProps) {
  const auth = await requireApiRole(["super_admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const { count: warehouseCount, error: warehouseCountError } = await supabase
    .from("warehouses")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", id);

  if (warehouseCountError) {
    return apiError("SUPABASE_ERROR", warehouseCountError.message, 500, warehouseCountError);
  }

  if ((warehouseCount ?? 0) > 0) {
    return apiError(
      "DEPENDENCY_EXISTS",
      `This branch cannot be deleted because ${warehouseCount} warehouse record(s) still depend on it. Reassign or remove those warehouses first.`,
      409,
    );
  }

  const { data: previousBranch } = await supabase
    .from("branches")
    .select("id, name, country, city, branch_type, status")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("branches").delete().eq("id", id);

  if (error) {
    return apiError("SUPABASE_ERROR", error.message, 500, error);
  }

  await writeAuditLog({
    action: "delete",
    module: "branches",
    oldValue: previousBranch ?? { id },
  });

  return ok({ id, status: "deleted" }, { mode: "supabase" });
}
