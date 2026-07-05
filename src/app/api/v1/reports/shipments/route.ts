import { ok } from "@/lib/api-responses";
import { getReportsSummary } from "@/lib/supabase/dire-data";

export async function GET() {
  const reports = await getReportsSummary();

  return ok(
    {
      total: reports.shipments.total,
      byStatus: reports.shipments.byStatus,
      byType: reports.shipments.byType,
      topRoutes: reports.shipments.topRoutes,
    },
    { mode: reports.mode },
  );
}
