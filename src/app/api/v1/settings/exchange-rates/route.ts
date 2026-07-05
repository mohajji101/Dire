import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { writeAuditLog } from "@/lib/supabase/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const exchangeRateSchema = z.object({
  effectiveDate: z.string().min(10),
  fromCurrency: z.string().min(3).max(3),
  rate: z.coerce.number().positive(),
  toCurrency: z.string().min(3).max(3).default("USD"),
});

export async function POST(request: Request) {
  const auth = await requireApiRole(["super_admin"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = exchangeRateSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const { data, error } = await supabase
    .from("exchange_rates")
    .insert({
      effective_date: parsed.data.effectiveDate,
      from_currency: parsed.data.fromCurrency.toUpperCase(),
      rate: parsed.data.rate,
      to_currency: parsed.data.toCurrency.toUpperCase(),
    })
    .select("id, from_currency, to_currency, rate, effective_date")
    .single();

  if (error || !data) {
    return apiError(
      "SUPABASE_ERROR",
      error?.message ?? "Failed to save exchange rate.",
      500,
      error,
    );
  }

  await writeAuditLog({
    action: "create",
    module: "exchange_rates",
    newValue: {
      effectiveDate: data.effective_date,
      fromCurrency: data.from_currency,
      id: data.id,
      rate: data.rate,
      toCurrency: data.to_currency,
    },
  });

  return ok(
    {
      effectiveDate: data.effective_date,
      fromCurrency: data.from_currency,
      id: data.id,
      rate: data.rate,
      toCurrency: data.to_currency,
    },
    { mode: "supabase" },
  );
}
