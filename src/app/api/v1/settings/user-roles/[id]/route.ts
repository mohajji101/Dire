import { apiError, ok } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { writeAuditLog } from "@/lib/supabase/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_: Request, { params }: RouteProps) {
  const auth = await requireApiRole(["super_admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const { data: assignment, error: assignmentError } = await supabase
    .from("user_roles")
    .select("id, role_id, roles(name)")
    .eq("id", id)
    .single();

  if (assignmentError || !assignment) {
    return apiError(
      "SUPABASE_ERROR",
      assignmentError?.message ?? "Role assignment was not found.",
      assignmentError?.code === "42501" ? 403 : assignmentError ? 500 : 404,
      assignmentError,
    );
  }

  const roleName =
    assignment.roles &&
    typeof assignment.roles === "object" &&
    "name" in assignment.roles
      ? String(assignment.roles.name)
      : null;

  if (roleName === "super_admin") {
    const { count, error: superAdminCountError } = await supabase
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role_id", assignment.role_id);

    if (superAdminCountError) {
      return apiError("SUPABASE_ERROR", superAdminCountError.message, 500, superAdminCountError);
    }

    if ((count ?? 0) <= 1) {
      return apiError(
        "DEPENDENCY_EXISTS",
        "This role cannot be revoked because it is the last super admin assignment in the system.",
        409,
      );
    }
  }

  const { error } = await supabase.from("user_roles").delete().eq("id", id);

  if (error) {
    return apiError("SUPABASE_ERROR", error.message, 500, error);
  }

  await writeAuditLog({
    action: "revoke_role",
    module: "user_roles",
    oldValue: assignment,
  });

  return ok({ id, status: "deleted" }, { mode: "supabase" });
}
