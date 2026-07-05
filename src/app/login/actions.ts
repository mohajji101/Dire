"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDefaultRouteForRole } from "@/lib/access-control";
import { normalizeCustomerType } from "@/lib/customer-types";
import { hasSupabaseEnv, hasSupabaseServiceRole } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  identifier: z.string().min(3, "Email or phone is required."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const signupSchema = z
  .object({
    address: z.string().optional(),
    city: z.string().min(2, "City is required."),
    companyName: z.string().optional(),
    country: z.string().min(2, "Country is required."),
    customerCode: z.string().trim().optional(),
    customerType: z.enum(["individual", "business", "government", "ngo"]),
    email: z.string().email("Valid email is required."),
    firstName: z.string().min(2, "First name is required."),
    lastName: z.string().min(2, "Last name is required."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    phone: z.string().min(6, "Phone is required."),
    confirmPassword: z.string().min(6, "Confirm your password."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .superRefine((value, context) => {
    if (
      value.customerType !== "individual" &&
      !value.companyName?.trim()
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Company or organization name is required for this customer type.",
        path: ["companyName"],
      });
    }
  });

function getFallbackRoleFromMetadata(user: { user_metadata?: unknown }) {
  if (
    user.user_metadata &&
    typeof user.user_metadata === "object" &&
    "auto_customer" in user.user_metadata &&
    user.user_metadata.auto_customer === true
  ) {
    return "customer";
  }

  return "user";
}

async function provisionCustomerAccess(params: {
  authUserId: string;
  email: string | null;
  metadata: Record<string, unknown>;
  phone: string | null;
}) {
  if (!hasSupabaseServiceRole()) {
    return null;
  }

  const adminClient = createAdminClient();
  const profileUpsert = await adminClient
    .from("users")
    .upsert(
      {
        auth_user_id: params.authUserId,
        created_at: new Date().toISOString(),
        email: params.email,
        phone: params.phone,
        status: "active",
      },
      { onConflict: "auth_user_id" },
    )
    .select("id")
    .single();

  if (profileUpsert.error || !profileUpsert.data?.id) {
    console.error("Customer profile upsert failed", {
      authUserId: params.authUserId,
      code: profileUpsert.error?.code ?? null,
      message: profileUpsert.error?.message ?? null,
    });
    return null;
  }

  const profileId = profileUpsert.data.id;
  const ensureResponse = await adminClient.rpc("ensure_customer_signup_profile", {
    metadata: params.metadata,
    profile_email: params.email,
    profile_phone: params.phone,
    profile_user_id: profileId,
  });

  if (ensureResponse.error) {
    console.error("Customer role provisioning failed", {
      authUserId: params.authUserId,
      code: ensureResponse.error.code ?? null,
      message: ensureResponse.error.message ?? null,
    });
    return profileId;
  }

  return profileId;
}

async function createConfirmedCustomerAuthUser(params: {
  email: string;
  metadata: Record<string, unknown>;
  password: string;
  phone: string;
}) {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.createUser({
    email: params.email,
    email_confirm: true,
    password: params.password,
    phone: params.phone,
    user_metadata: params.metadata,
  });

  if (error) {
    return { data: null, error };
  }

  if (data.user) {
    await provisionCustomerAccess({
      authUserId: data.user.id,
      email: data.user.email ?? params.email,
      metadata: params.metadata,
      phone: data.user.phone ?? params.phone,
    });
  }

  return { data, error: null };
}

async function validateClaimedCustomerCode(customerCode: string | undefined) {
  const normalizedCode = customerCode?.trim().toUpperCase();

  if (!normalizedCode || !hasSupabaseServiceRole()) {
    return { code: normalizedCode ?? null, ok: true as const };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("customers")
    .select("id, customer_code, user_id")
    .eq("customer_code", normalizedCode)
    .maybeSingle();

  if (error) {
    return {
      code: normalizedCode,
      message: error.message,
      ok: false as const,
      status: 500,
    };
  }

  if (!data) {
    return {
      code: normalizedCode,
      message: "Customer code was not found. Use the code given by Dire Cargo or leave it blank for a brand new customer.",
      ok: false as const,
      status: 404,
    };
  }

  if (data.user_id) {
    return {
      code: normalizedCode,
      message: "This customer code is already linked to a portal account.",
      ok: false as const,
      status: 409,
    };
  }

  return { code: normalizedCode, ok: true as const };
}

export async function signInAction(formData: FormData) {
  const result = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  const nextPath = String(formData.get("next") ?? "").trim();
  const rememberDevice = formData.get("rememberDevice") === "on";

  if (!result.success) {
    redirect("/login?error=invalid");
  }

  const cookieStore = await cookies();
  if (rememberDevice) {
    cookieStore.set("dire_last_identifier", result.data.identifier, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });
  } else {
    cookieStore.delete("dire_last_identifier");
  }

  if (!hasSupabaseEnv()) {
    redirect("/operations?mode=demo");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    ...(result.data.identifier.includes("@")
      ? { email: result.data.identifier }
      : { phone: result.data.identifier }),
    password: result.data.password,
  });

  if (error) {
    redirect(`/login?error=credentials&reason=${encodeURIComponent(error.message)}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=credentials");
  }

  let profileId: string | null = null;
  let rawRole = getFallbackRoleFromMetadata(user);
  const adminClient = hasSupabaseServiceRole() ? createAdminClient() : null;

  const profileResponse = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profileResponse.data?.id && adminClient) {
    const adminProfileUpsert = await adminClient
      .from("users")
      .upsert(
        {
          auth_user_id: user.id,
          created_at: new Date().toISOString(),
          email: user.email ?? null,
          phone: user.phone ?? null,
          status: "active",
        },
        { onConflict: "auth_user_id" },
      )
      .select("id")
      .single();

    if (adminProfileUpsert.data?.id) {
      profileId = adminProfileUpsert.data.id;

      if (user.user_metadata?.auto_customer === true) {
        await provisionCustomerAccess({
          authUserId: user.id,
          email: user.email ?? null,
          metadata:
            user.user_metadata && typeof user.user_metadata === "object"
              ? user.user_metadata
              : {},
          phone: user.phone ?? null,
        });
      }
    }
  } else if (profileResponse.data?.id) {
    profileId = profileResponse.data.id;
  }

  const roleClient = adminClient ?? supabase;
  if (profileId) {
    const roleResponse = await roleClient
      .from("user_roles")
      .select("roles(name)")
      .eq("user_id", profileId)
      .limit(1);

    const roleRow = roleResponse.data?.[0];
    if (
      roleRow &&
      typeof roleRow === "object" &&
      "roles" in roleRow &&
      roleRow.roles &&
      typeof roleRow.roles === "object" &&
      "name" in roleRow.roles
    ) {
        rawRole = String(roleRow.roles.name);
      }
  }

  if (
    rawRole === "user" &&
    user.user_metadata?.auto_customer === true &&
    hasSupabaseServiceRole()
  ) {
    const reprovisionedProfileId = await provisionCustomerAccess({
      authUserId: user.id,
      email: user.email ?? null,
      metadata:
        user.user_metadata && typeof user.user_metadata === "object"
          ? user.user_metadata
          : {},
      phone: user.phone ?? null,
    });

    if (reprovisionedProfileId) {
      profileId = reprovisionedProfileId;
      const refreshedRoleResponse = await createAdminClient()
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", profileId)
        .limit(1);
      const refreshedRoleRow = refreshedRoleResponse.data?.[0];
      if (
        refreshedRoleRow &&
        typeof refreshedRoleRow === "object" &&
        "roles" in refreshedRoleRow &&
        refreshedRoleRow.roles &&
        typeof refreshedRoleRow.roles === "object" &&
        "name" in refreshedRoleRow.roles
      ) {
        rawRole = String(refreshedRoleRow.roles.name);
      }
    }
  }

  const destination =
    nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : getDefaultRouteForRole(rawRole);

  redirect(destination);
}

export async function signUpAction(formData: FormData) {
  const result = signupSchema.safeParse({
    address: formData.get("address"),
    city: formData.get("city"),
    companyName: formData.get("companyName"),
    confirmPassword: formData.get("confirmPassword"),
    country: formData.get("country"),
    customerCode: formData.get("customerCode"),
    customerType: formData.get("customerType"),
    email: formData.get("email"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    password: formData.get("password"),
    phone: formData.get("phone"),
  });

  if (!result.success) {
    redirect("/signup?error=invalid");
  }

  if (!hasSupabaseEnv()) {
    redirect("/signup?notice=demo");
  }

  const customerCodeCheck = await validateClaimedCustomerCode(result.data.customerCode);
  if (!customerCodeCheck.ok) {
    redirect(
      `/signup?error=invalid&reason=${encodeURIComponent(customerCodeCheck.message)}`,
    );
  }

  const signupMetadata = {
    address: result.data.address ?? "",
    auto_customer: true,
    city: result.data.city,
    company_name: result.data.companyName?.trim() ?? "",
    country: result.data.country,
    customer_code: customerCodeCheck.code ?? "",
    customer_type: normalizeCustomerType(result.data.customerType),
    first_name: result.data.firstName,
    last_name: result.data.lastName,
    phone: result.data.phone,
  };
  const cookieStore = await cookies();
  cookieStore.set("dire_last_identifier", result.data.email, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
  });

  if (hasSupabaseServiceRole()) {
    const { data: adminData, error: adminError } =
      await createConfirmedCustomerAuthUser({
        email: result.data.email,
        metadata: signupMetadata,
        password: result.data.password,
        phone: result.data.phone,
      });

    if (adminError) {
      console.error("Customer signup admin create failed", {
        code: adminError.code,
        message: adminError.message,
        status: adminError.status ?? null,
      });
      redirect(
        `/signup?error=credentials&reason=${encodeURIComponent(adminError.message)}`,
      );
    }

    if (!adminData?.user) {
      redirect("/signup?error=credentials&reason=Unable%20to%20create%20user");
    }

    redirect("/login?notice=signup_success&force=1");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: signupMetadata,
    },
  });

  if (error) {
    const normalizedMessage = error.message.toLowerCase();

    if (normalizedMessage.includes("rate limit") && hasSupabaseServiceRole()) {
      const { data: adminData, error: adminError } =
        await createConfirmedCustomerAuthUser({
          email: result.data.email,
          metadata: signupMetadata,
          password: result.data.password,
          phone: result.data.phone,
        });

      if (adminError) {
        console.error("Customer signup admin fallback failed", {
          code: adminError.code,
          message: adminError.message,
          status: adminError.status ?? null,
        });
        redirect(
          `/signup?error=credentials&reason=${encodeURIComponent(adminError.message)}`,
        );
      }

      if (!adminData.user) {
        redirect("/signup?error=credentials&reason=Unable%20to%20create%20user");
      }

      redirect("/login?notice=signup_success&force=1");
    }

    console.error("Customer signup failed", {
      code: error.code,
      message: error.message,
      status: error.status ?? null,
    });
    redirect(`/signup?error=credentials&reason=${encodeURIComponent(error.message)}`);
  }

  if (data.session) {
    await supabase.auth.signOut();
  }

  if (data.user && hasSupabaseServiceRole()) {
    await provisionCustomerAccess({
      authUserId: data.user.id,
      email: data.user.email ?? result.data.email,
      metadata: signupMetadata,
      phone: data.user.phone ?? result.data.phone,
    });
  }

  redirect(
    data.session
      ? "/login?notice=signup_success&force=1"
      : "/login?notice=signup_verify&force=1",
  );
}

export async function otpAction(formData: FormData) {
  const identifier = String(formData.get("identifier") ?? "").trim();

  if (!identifier) {
    redirect("/login?error=invalid");
  }

  if (!hasSupabaseEnv()) {
    redirect("/login?notice=otp_demo");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp(
    identifier.includes("@")
      ? {
          email: identifier,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/login`,
            shouldCreateUser: false,
          },
        }
      : {
          options: {
            shouldCreateUser: false,
          },
          phone: identifier,
        },
  );

  if (error) {
    redirect(`/login?error=credentials&reason=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?notice=otp_sent");
}

export async function passwordResetAction(formData: FormData) {
  const identifier = String(formData.get("identifier") ?? "").trim();

  if (!identifier) {
    redirect("/login?error=invalid");
  }

  if (!hasSupabaseEnv()) {
    redirect("/login?notice=reset_demo");
  }

  const supabase = await createClient();
  if (!identifier.includes("@")) {
    redirect("/login?notice=reset_email_only");
  }
  const { error } = await supabase.auth.resetPasswordForEmail(identifier, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/login`,
  });

  if (error) {
    redirect("/login?error=credentials");
  }

  redirect("/login?notice=reset_sent");
}

export async function signOutAction() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
