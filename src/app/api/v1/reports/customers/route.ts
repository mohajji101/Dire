import { ok } from "@/lib/api-responses";
import { getReportsSummary } from "@/lib/supabase/dire-data";

export async function GET() {
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
