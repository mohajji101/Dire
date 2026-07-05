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
      total: reports.shipments.total,
      byStatus: reports.shipments.byStatus,
      byType: reports.shipments.byType,
      topRoutes: reports.shipments.topRoutes,
    },
    { mode: reports.mode },
  );
}
