import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { writeAuditLog } from "@/lib/supabase/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const createBranchSchema = z.object({
  branchType: z.enum(["HQ", "Office", "Warehouse"]),
  city: z.string().min(2),
  country: z.string().min(2),
  name: z.string().min(2),
  status: z.enum(["active", "inactive"]).default("active"),
});

export async function POST(request: Request) {
  const auth = await requireApiRole(["super_admin"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createBranchSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const { data, error } = await supabase
    .from("branches")
    .insert({
      branch_type: parsed.data.branchType,
      city: parsed.data.city,
      country: parsed.data.country,
      name: parsed.data.name,
      status: parsed.data.status,
    })
    .select("id, name, country, city, branch_type, status")
    .single();

  if (error || !data) {
    return apiError(
      "SUPABASE_ERROR",
      error?.message ?? "Failed to create branch.",
      500,
      error,
    );
  }

  await writeAuditLog({
    action: "create",
    module: "branches",
    newValue: {
      branchType: data.branch_type,
      city: data.city,
      country: data.country,
      id: data.id,
      name: data.name,
      status: data.status,
    },
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
