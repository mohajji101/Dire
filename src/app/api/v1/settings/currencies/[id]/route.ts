import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { writeAuditLog } from "@/lib/supabase/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteProps = {
  params: Promise<{ id: string }>;
};

const updateCurrencySchema = z.object({
  code: z.string().trim().min(3).max(3),
  name: z.string().trim().min(2),
  symbol: z.string().trim().min(1).max(8),
});

async function getCurrencyDependencyCounts(
  supabase: Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createAdminClient>,
  code: string,
) {
  const [
    pricingRules,
    exchangeRatesFrom,
    exchangeRatesTo,
    invoices,
    payments,
    expenses,
    buyShipRequests,
  ] = await Promise.all([
    supabase.from("pricing_rules").select("id", { count: "exact", head: true }).eq("currency", code),
    supabase.from("exchange_rates").select("id", { count: "exact", head: true }).eq("from_currency", code),
    supabase.from("exchange_rates").select("id", { count: "exact", head: true }).eq("to_currency", code),
    supabase.from("invoices").select("id", { count: "exact", head: true }).eq("currency", code),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("currency", code),
    supabase.from("expenses").select("id", { count: "exact", head: true }).eq("currency", code),
    supabase.from("buy_ship_requests").select("id", { count: "exact", head: true }).eq("currency", code),
  ]);

  const error =
    pricingRules.error ||
    exchangeRatesFrom.error ||
    exchangeRatesTo.error ||
    invoices.error ||
    payments.error ||
    expenses.error ||
    buyShipRequests.error;

  if (error) {
    return { error };
  }

  return {
    error: null,
    counts: {
      buyShipRequests: buyShipRequests.count ?? 0,
      exchangeRates: (exchangeRatesFrom.count ?? 0) + (exchangeRatesTo.count ?? 0),
      expenses: expenses.count ?? 0,
      invoices: invoices.count ?? 0,
      payments: payments.count ?? 0,
      pricingRules: pricingRules.count ?? 0,
    },
  };
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const auth = await requireApiRole(["super_admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateCurrencySchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const normalizedCode = parsed.data.code.toUpperCase();
  const { data: currentCurrency, error: currentCurrencyError } = await supabase
    .from("currencies")
    .select("id, code")
    .eq("id", id)
    .single();

  if (currentCurrencyError || !currentCurrency) {
    return apiError(
      "SUPABASE_ERROR",
      currentCurrencyError?.message ?? "Currency not found.",
      currentCurrencyError?.code === "42501" ? 403 : currentCurrencyError ? 500 : 404,
      currentCurrencyError,
    );
  }

  const { data: existingCurrency, error: existingCurrencyError } = await supabase
    .from("currencies")
    .select("id, code")
    .eq("code", normalizedCode)
    .neq("id", id)
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

  if (normalizedCode !== currentCurrency.code) {
    const dependencyResult = await getCurrencyDependencyCounts(supabase, currentCurrency.code);
    if (dependencyResult.error) {
      return apiError(
        "SUPABASE_ERROR",
        dependencyResult.error.message,
        500,
        dependencyResult.error,
      );
    }

    const totalDependencies = Object.values(dependencyResult.counts).reduce(
      (sum, value) => sum + value,
      0,
    );

    if (totalDependencies > 0) {
      return apiError(
        "DEPENDENCY_EXISTS",
        `Currency code ${currentCurrency.code} cannot be changed because it is already used in pricing, rates, invoices, payments, expenses, or Buy & Ship records.`,
        409,
      );
    }
  }

  const { data, error } = await supabase
    .from("currencies")
    .update({
      code: normalizedCode,
      name: parsed.data.name,
      symbol: parsed.data.symbol,
    })
    .eq("id", id)
    .select("id, code, name, symbol")
    .single();

  if (error || !data) {
    return apiError(
      "SUPABASE_ERROR",
      error?.message ?? "Failed to update currency.",
      500,
      error,
    );
  }

  await writeAuditLog({
    action: "update",
    module: "currencies",
    newValue: {
      code: data.code,
      id: data.id,
      name: data.name,
      symbol: data.symbol,
    },
    oldValue: currentCurrency,
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

export async function DELETE(_: Request, { params }: RouteProps) {
  const auth = await requireApiRole(["super_admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const { data: currentCurrency, error: currentCurrencyError } = await supabase
    .from("currencies")
    .select("id, code")
    .eq("id", id)
    .single();

  if (currentCurrencyError || !currentCurrency) {
    return apiError(
      "SUPABASE_ERROR",
      currentCurrencyError?.message ?? "Currency not found.",
      currentCurrencyError?.code === "42501" ? 403 : currentCurrencyError ? 500 : 404,
      currentCurrencyError,
    );
  }

  const dependencyResult = await getCurrencyDependencyCounts(supabase, currentCurrency.code);
  if (dependencyResult.error) {
    return apiError(
      "SUPABASE_ERROR",
      dependencyResult.error.message,
      500,
      dependencyResult.error,
    );
  }

  const dependencyEntries = Object.entries(dependencyResult.counts).filter(([, count]) => count > 0);
  if (dependencyEntries.length > 0) {
    const details = dependencyEntries
      .map(([label, count]) => `${count} ${label}`)
      .join(", ");
    return apiError(
      "DEPENDENCY_EXISTS",
      `Currency ${currentCurrency.code} cannot be deleted because it is still used by: ${details}.`,
      409,
    );
  }

  const { error } = await supabase.from("currencies").delete().eq("id", id);

  if (error) {
    return apiError("SUPABASE_ERROR", error.message, 500, error);
  }

  await writeAuditLog({
    action: "delete",
    module: "currencies",
    oldValue: currentCurrency,
  });

  return ok({ id, status: "deleted" }, { mode: "supabase" });
}
