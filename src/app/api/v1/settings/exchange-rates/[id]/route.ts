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
  const { data: previousRate } = await supabase
    .from("exchange_rates")
    .select("id, from_currency, to_currency, rate, effective_date")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("exchange_rates").delete().eq("id", id);

  if (error) {
    return apiError("SUPABASE_ERROR", error.message, 500, error);
  }

  await writeAuditLog({
    action: "delete",
    module: "exchange_rates",
    oldValue: previousRate ?? { id },
  });

  return ok({ id, status: "deleted" }, { mode: "supabase" });
}
