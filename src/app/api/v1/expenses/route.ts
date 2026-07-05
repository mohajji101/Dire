import { z } from "zod";
import { apiError, ok, validationError } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { hasSupabaseServiceRole } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { listExpenses } from "@/lib/supabase/dire-data";
import { createClient } from "@/lib/supabase/server";

const createExpenseSchema = z.object({
  amount: z.number().positive(),
  category: z.string().min(2),
  currency: z.string().trim().min(3).max(10).transform((value) => value.toUpperCase()),
  description: z.string().optional(),
});

export async function GET() {
  const { items, mode } = await listExpenses();
  return ok(items, { count: items.length, mode });
}

export async function POST(request: Request) {
  const auth = await requireApiRole(["super_admin", "finance"]);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = createExpenseSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const currencyCode = parsed.data.currency;

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      amount: parsed.data.amount,
      category: parsed.data.category,
      currency: currencyCode,
      description: parsed.data.description ?? null,
    })
    .select("id, amount, category, currency, description, created_at")
    .single();

  if (error || !data) {
    return apiError(
      "SUPABASE_ERROR",
      error?.message?.includes("row-level security")
        ? "Expense insert was blocked by Supabase RLS. Run the updated expense policies from supabase/rls_setup.sql, or add SUPABASE_SERVICE_ROLE_KEY so finance writes can use the admin client."
        : error?.message ?? "Failed to save expense.",
      500,
      error,
    );
  }

  return ok(
    {
      amount: Number(data.amount ?? 0),
      category: data.category,
      createdAt: data.created_at?.slice(0, 10) ?? "",
      currency: String(data.currency ?? currencyCode).toUpperCase(),
      description: data.description ?? "",
      id: data.id,
    },
    { mode: "supabase" },
  );
}
