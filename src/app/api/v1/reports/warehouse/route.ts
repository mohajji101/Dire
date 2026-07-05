import { ok } from "@/lib/api-responses";
import { getReportsSummary } from "@/lib/supabase/dire-data";

export async function GET() {
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
