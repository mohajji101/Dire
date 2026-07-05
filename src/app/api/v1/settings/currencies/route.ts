import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { writeAuditLog } from "@/lib/supabase/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const createCurrencySchema = z.object({
  code: z.string().trim().min(3).max(3),
  name: z.string().trim().min(2),
  symbol: z.string().trim().min(1).max(8),
});

export async function POST(request: Request) {
  const auth = await requireApiRole(["super_admin"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createCurrencySchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const normalizedCode = parsed.data.code.toUpperCase();
  const { data: existingCurrency, error: existingCurrencyError } = await supabase
    .from("currencies")
    .select("id, code")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (existingCurrencyError) {
    return apiError(
      "SUPABASE_ERROR",
      existingCurrencyError.message,
      500,
      existingCurrencyError,
    );
  }

  if (existingCurrency) {
    return apiError(
      "DUPLICATE_CURRENCY",
      `Currency code ${normalizedCode} already exists.`,
      409,
    );
  }

  const { data, error } = await supabase
    .from("currencies")
    .insert({
      code: normalizedCode,
      name: parsed.data.name,
      symbol: parsed.data.symbol,
    })
    .select("id, code, name, symbol")
    .single();

  if (error || !data) {
    return apiError(
      "SUPABASE_ERROR",
      error?.message ?? "Failed to create currency.",
      500,
      error,
    );
  }

  await writeAuditLog({
    action: "create",
    module: "currencies",
    newValue: {
      code: data.code,
      id: data.id,
      name: data.name,
      symbol: data.symbol,
    },
  });

  return ok(
    {
      code: data.code,
      id: data.id,
      name: data.name,
      symbol: data.symbol,
    },
    { mode: "supabase" },
  );
}
