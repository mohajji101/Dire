import { z } from "zod";
import { requireApiRole } from "@/lib/api-auth";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { hasSupabaseEnv, hasSupabaseServiceRole } from "@/lib/env";
import { writeAuditLog } from "@/lib/supabase/audit";
import { createAdminClient } from "@/lib/supabase/admin";

const mergeCustomerSchema = z.object({
  sourceCustomerId: z.string().uuid(),
  targetCustomerId: z.string().uuid(),
});

export async function POST(request: Request) {
  const auth = await requireApiRole(["super_admin", "operations"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = mergeCustomerSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const { sourceCustomerId, targetCustomerId } = parsed.data;

  if (sourceCustomerId === targetCustomerId) {
    return apiError("VALIDATION_ERROR", "Source and target customer cannot be the same.", 422);
  }

  if (!hasSupabaseEnv()) {
    return ok(
      {
        sourceCustomerId,
        targetCustomerId,
      },
      { mode: "demo" },
    );
  }

  if (!hasSupabaseServiceRole()) {
    return apiError(
      "CONFIGURATION_ERROR",
      "SUPABASE_SERVICE_ROLE_KEY is required for customer merge writes.",
      500,
    );
  }

  const supabase = createAdminClient();
  const { data: mergeResult, error: mergeError } = await supabase.rpc("merge_customers", {
    source_customer_id: sourceCustomerId,
    target_customer_id: targetCustomerId,
  });

  if (mergeError || !mergeResult) {
    const message = mergeError?.message ?? "Customer merge failed.";
    const status =
      message.includes("not found")
        ? 404
        : message.includes("different linked portal users")
          ? 409
          : 500;
    return apiError("SUPABASE_ERROR", message, status, mergeError);
  }

  await writeAuditLog({
    action: "merge_customers",
    module: "customers",
    newValue:
      typeof mergeResult === "object" && mergeResult !== null
        ? mergeResult
        : {
            sourceCustomerId,
            targetCustomerId,
          },
  });

  return ok(
    mergeResult,
    { mode: "supabase" },
  );
}
