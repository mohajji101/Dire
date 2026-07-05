import { ok } from "@/lib/api-responses";
import { requireApiRole } from "@/lib/api-auth";
import { getReportsSummary } from "@/lib/supabase/dire-data";

export async function GET() {
  const auth = await requireApiRole([
    "super_admin",
    "operations",
    "finance",
    "support",
    "warehouse",
  ]);
  if (!auth.ok) return auth.response;

  const reports = await getReportsSummary();

  return ok(
    {
      total: reports.customers.total,
      active: reports.customers.active,
      pending: reports.customers.pending,
      topCustomers: reports.customers.topCustomers,
    },
    { mode: reports.mode },
  );
}
