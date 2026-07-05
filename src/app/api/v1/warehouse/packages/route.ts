import { ok } from "@/lib/api-responses";
import { listWarehousePackages } from "@/lib/supabase/dire-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const warehouse = url.searchParams.get("warehouse");
  const zone = url.searchParams.get("zone");
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");
  const { items, mode } = await listWarehousePackages({
    search,
    status,
    warehouse,
    zone,
  });

  return ok(items, {
    count: items.length,
    mode,
  });
}
