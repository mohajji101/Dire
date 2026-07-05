import { apiError, ok } from "@/lib/api-responses";
import { demoShipments, shipmentTimeline } from "@/lib/demo-data";
import { hasSupabaseEnv, hasSupabaseServiceRole } from "@/lib/env";
import { formatShipmentTimelineStatus, getShipmentLocationLabel } from "@/lib/shipment-status";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    trackingNumber: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { trackingNumber } = await context.params;

  if (hasSupabaseEnv()) {
    const supabase = hasSupabaseServiceRole()
      ? createAdminClient()
      : await createClient();
    const { data: shipmentRow, error: shipmentError } = await supabase
      .from("shipments")
      .select("id, tracking_number, shipment_type, status, origin_country, destination_country, expected_arrival")
      .ilike("tracking_number", trackingNumber)
      .maybeSingle();

    if (shipmentError) {
      return apiError(
        "SUPABASE_ERROR",
        shipmentError.message,
        shipmentError.code === "42501" ? 403 : 500,
        shipmentError,
      );
    }

    if (shipmentRow) {
      const [statusResponse, invoiceResponse] = await Promise.all([
        supabase
          .from("shipment_status_history")
          .select("status, notes, created_at")
          .eq("shipment_id", shipmentRow.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("invoices")
          .select("status")
          .eq("shipment_id", shipmentRow.id)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

      return ok(
        {
          shipment: {
            destination: shipmentRow.destination_country ?? "Unknown destination",
            expectedArrival: shipmentRow.expected_arrival ?? "",
            invoiceStatus: invoiceResponse.data?.[0]?.status ?? "draft",
            location: getShipmentLocationLabel(shipmentRow.status ?? "pending"),
            origin: shipmentRow.origin_country ?? "Unknown origin",
            shipmentType:
              shipmentRow.shipment_type === "SEA"
                ? "SEA"
                : shipmentRow.shipment_type === "BUY_AND_SHIP"
                  ? "BUY_AND_SHIP"
                  : "AIR",
            status: shipmentRow.status ?? "pending",
            trackingNumber: shipmentRow.tracking_number,
          },
          timeline:
            statusResponse.data && statusResponse.data.length
              ? statusResponse.data.map((event) => ({
                  date: event.created_at
                    ? new Date(event.created_at).toISOString().slice(0, 16).replace("T", " ")
                    : "",
                  notes: event.notes ?? "Status updated.",
                  status: formatShipmentTimelineStatus(event.status),
                }))
              : [],
        },
        { mode: "supabase" },
      );
    }
  }

  const shipment = demoShipments.find(
    (item) => item.trackingNumber.toLowerCase() === trackingNumber.toLowerCase(),
  );

  if (!shipment) {
    return apiError("NOT_FOUND", "Shipment tracking number was not found.", 404);
  }

  return ok(
    {
      shipment: {
        destination: shipment.destination,
        expectedArrival: shipment.expectedArrival,
        invoiceStatus: shipment.invoiceStatus,
        location: shipment.location,
        origin: shipment.origin,
        shipmentType: shipment.shipmentType,
        status: shipment.status,
        trackingNumber: shipment.trackingNumber,
      },
      timeline: shipmentTimeline,
    },
    { mode: "demo" },
  );
}
