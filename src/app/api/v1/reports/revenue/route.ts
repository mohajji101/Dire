import { ok } from "@/lib/api-responses";
import { getReportsSummary } from "@/lib/supabase/dire-data";

export async function GET() {
  const reports = await getReportsSummary();

  return ok(
    {
      revenue: reports.revenue.revenue,
      expenses: reports.revenue.expenses,
      profit: reports.revenue.profit,
      monthlyRevenue: reports.revenue.monthlyRevenue,
    },
    { mode: reports.mode },
  );
}
