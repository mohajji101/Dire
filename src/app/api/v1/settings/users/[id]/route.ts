import { apiError, ok } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { writeAuditLog } from "@/lib/supabase/audit";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_: Request, { params }: RouteProps) {
  const auth = await requireApiRole(["super_admin"]);
  if (!auth.ok) return auth.response;

  if (!hasSupabaseServiceRole()) {
    return apiError(
      "SERVICE_ROLE_REQUIRED",
      "SUPABASE_SERVICE_ROLE_KEY is required for deleting users.",
      500,
    );
  }

  const { id } = await params;
  const supabase = createAdminClient();
  const { data: userRecord, error: userError } = await supabase
    .from("users")
    .select("id, auth_user_id, email, status")
    .eq("id", id)
    .maybeSingle();

  if (userError) {
    return apiError("SUPABASE_ERROR", userError.message, 500, userError);
  }

  if (!userRecord) {
    return apiError("NOT_FOUND", "User was not found.", 404);
  }

  if (!userRecord.auth_user_id) {
    return apiError(
      "AUTH_USER_MISSING",
      "This user does not have a linked Supabase auth account to delete.",
      409,
    );
  }

  if (auth.value.profileId && auth.value.profileId === userRecord.id) {
    return apiError(
      "FORBIDDEN",
      "You cannot delete the account you are currently signed in with.",
      403,
    );
  }

  const { data: roleAssignments, error: rolesError } = await supabase
    .from("user_roles")
    .select("id, role_id, roles(name)")
    .eq("user_id", userRecord.id);

  if (rolesError) {
    return apiError("SUPABASE_ERROR", rolesError.message, 500, rolesError);
  }

  const hasSuperAdminRole = (roleAssignments ?? []).some((assignment) => {
    return (
      assignment.roles &&
      typeof assignment.roles === "object" &&
      "name" in assignment.roles &&
      String(assignment.roles.name) === "super_admin"
    );
  });

  if (hasSuperAdminRole) {
    const superAdminRoleIds = (roleAssignments ?? [])
      .filter((assignment) => {
        return (
          assignment.roles &&
          typeof assignment.roles === "object" &&
          "name" in assignment.roles &&
          String(assignment.roles.name) === "super_admin"
        );
      })
      .map((assignment) => assignment.role_id);

    for (const roleId of superAdminRoleIds) {
      const { count, error: countError } = await supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role_id", roleId);

      if (countError) {
        return apiError("SUPABASE_ERROR", countError.message, 500, countError);
      }

      if ((count ?? 0) <= 1) {
        return apiError(
          "DEPENDENCY_EXISTS",
          "This user cannot be deleted because it is the last super admin account in the system.",
          409,
        );
      }
    }
  }

  const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(
    userRecord.auth_user_id,
  );

  if (deleteAuthError) {
    return apiError("SUPABASE_ERROR", deleteAuthError.message, 500, deleteAuthError);
  }

  await writeAuditLog({
    action: "delete_user",
    module: "users",
    oldValue: {
      email: userRecord.email,
      id: userRecord.id,
      status: userRecord.status,
    },
  });

  return ok(
    {
      email: userRecord.email,
      id: userRecord.id,
      status: "deleted",
    },
    { mode: "supabase" },
  );
}
