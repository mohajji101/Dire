import { ok } from "@/lib/api-responses";
import { listWarehouseZones } from "@/lib/supabase/dire-data";

export async function GET() {
  const { items, mode } = await listWarehouseZones();
  return ok(items, { mode });
}
