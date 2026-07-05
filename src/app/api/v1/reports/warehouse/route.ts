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
      packages: reports.warehouse.packages,
      pendingVerification: reports.warehouse.pendingVerification,
      readyForShipment: reports.warehouse.readyForShipment,
      capacity: reports.warehouse.capacity,
    },
    { mode: reports.mode },
  );
}
