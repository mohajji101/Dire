import { apiError, ok, validationError } from "@/lib/api-responses";
import { demoShipments } from "@/lib/demo-data";
import { getShipmentDetail } from "@/lib/supabase/dire-data";
import { z } from "zod";

const updateShipmentSchema = z.object({
  status: z.string().optional(),
  expectedArrival: z.string().optional(),
  location: z.string().optional(),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const detail = await getShipmentDetail(id);

  if (!detail) {
    return apiError("NOT_FOUND", "Shipment was not found.", 404);
  }

  return ok(detail, { mode: detail.mode });
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateShipmentSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const shipment = demoShipments.find((item) => item.id === id);

  if (!shipment) {
    return apiError("NOT_FOUND", "Shipment was not found.", 404);
  }

  return ok(
    {
      ...shipment,
      ...parsed.data,
    },
    { mode: "demo" },
  );
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const shipment = demoShipments.find((item) => item.id === id);

  if (!shipment) {
    return apiError("NOT_FOUND", "Shipment was not found.", 404);
  }

  return ok({ id, status: "cancelled" }, { mode: "demo" });
}
