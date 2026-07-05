import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const changePasswordSchema = z
  .object({
    confirmPassword: z.string().min(6),
    newPassword: z.string().min(6),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  if (!hasSupabaseEnv()) {
    return ok({ updated: true }, { mode: "demo" });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiError("UNAUTHENTICATED", "No active session.", 401, authError);
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (error) {
    return apiError("SUPABASE_ERROR", error.message, 500, error);
  }

  return ok({ updated: true }, { mode: "supabase" });
}
