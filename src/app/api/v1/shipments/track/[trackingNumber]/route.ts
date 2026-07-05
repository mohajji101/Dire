import { apiError, ok } from "@/lib/api-responses";
import { demoShipments, shipmentTimeline } from "@/lib/demo-data";

type RouteContext = {
  params: Promise<{
    trackingNumber: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { trackingNumber } = await context.params;
  const shipment = demoShipments.find(
    (item) => item.trackingNumber.toLowerCase() === trackingNumber.toLowerCase(),
  );

  if (!shipment) {
    return apiError("NOT_FOUND", "Shipment tracking number was not found.", 404);
  }

  return ok(
    {
      shipment,
      timeline: shipmentTimeline,
    },
    { mode: "demo" },
  );
}
