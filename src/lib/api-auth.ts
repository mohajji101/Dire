import { apiError } from "@/lib/api-responses";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { normalizeAppRole, type AppRole } from "@/lib/access-control";

type ApiAuthSuccess = {
  authUserId: string | null;
  profileId: string | null;
  role: AppRole;
};

type ApiAuthResult =
  | { ok: true; value: ApiAuthSuccess }
  | { ok: false; response: ReturnType<typeof apiError> };

export async function getCurrentCustomerId(profileId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", profileId)
    .maybeSingle();

  if (error) {
    return {
      ok: false as const,
      response: apiError("SUPABASE_ERROR", error.message, 500, error),
    };
  }

  if (!data?.id) {
    return {
      ok: false as const,
      response: apiError("FORBIDDEN", "Customer profile not found for this user.", 403),
    };
  }

  return {
    ok: true as const,
    customerId: data.id,
  };
}

export async function requireApiRole(allowedRoles: AppRole[]): Promise<ApiAuthResult> {
  if (!hasSupabaseEnv()) {
    return {
      ok: true,
      value: {
        authUserId: null,
        profileId: null,
        role: "super_admin",
      },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: apiError("UNAUTHENTICATED", "No active session.", 401, error),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError || !profile?.id) {
    return {
      ok: false,
      response: apiError(
        "PROFILE_NOT_FOUND",
        "User profile not found.",
        404,
        profileError,
      ),
    };
  }

  const { data: roleRows, error: roleError } = await supabase
    .from("user_roles")
    .select("roles(name)")
    .eq("user_id", profile.id)
    .limit(1);

  if (roleError) {
    return {
      ok: false,
      response: apiError("SUPABASE_ERROR", roleError.message, 500, roleError),
    };
  }

  const rawRole =
    Array.isArray(roleRows) &&
    roleRows[0] &&
    typeof roleRows[0] === "object" &&
    roleRows[0] !== null &&
    "roles" in roleRows[0] &&
    roleRows[0].roles &&
    typeof roleRows[0].roles === "object" &&
    "name" in roleRows[0].roles
      ? String(roleRows[0].roles.name)
      : user.user_metadata &&
          typeof user.user_metadata === "object" &&
          "auto_customer" in user.user_metadata &&
          user.user_metadata.auto_customer === true
        ? "customer"
        : "user";

  const role = normalizeAppRole(rawRole);

  if (!allowedRoles.includes(role)) {
    return {
      ok: false,
      response: apiError(
        "FORBIDDEN",
        "You do not have permission to perform this action.",
        403,
      ),
    };
  }

  return {
    ok: true,
    value: {
      authUserId: user.id,
      profileId: profile.id,
      role,
    },
  };
}
