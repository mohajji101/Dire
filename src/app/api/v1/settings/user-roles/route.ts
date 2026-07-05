import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { writeAuditLog } from "@/lib/supabase/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const assignRoleSchema = z.object({
  roleId: z.string().uuid(),
  userId: z.string().uuid(),
});

export async function POST(request: Request) {
  const auth = await requireApiRole(["super_admin"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = assignRoleSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", parsed.data.userId)
    .eq("role_id", parsed.data.roleId)
    .maybeSingle();

  if (existingError) {
    return apiError("SUPABASE_ERROR", existingError.message, 500, existingError);
  }

  if (existing) {
    return apiError("DUPLICATE_ROLE", "This user already has that role.", 409);
  }

  const { data, error } = await supabase
    .from("user_roles")
    .insert({
      role_id: parsed.data.roleId,
      user_id: parsed.data.userId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return apiError(
      "SUPABASE_ERROR",
      error?.message ?? "Failed to assign role.",
      500,
      error,
    );
  }

  await writeAuditLog({
    action: "assign_role",
    module: "user_roles",
    newValue: {
      assignmentId: data.id,
      roleId: parsed.data.roleId,
      userId: parsed.data.userId,
    },
  });

  return ok(
    {
      id: data.id,
      roleId: parsed.data.roleId,
      userId: parsed.data.userId,
    },
    { mode: "supabase" },
  );
}
