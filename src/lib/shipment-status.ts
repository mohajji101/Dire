import { type ShipmentStatus } from "@/lib/demo-data";

export const shipmentStatusLabels: Record<ShipmentStatus, string> = {
  pending: "Booking Created",
  in_warehouse: "China Warehouse",
  in_transit: "In Transit to Muqdisho HQ",
  customs_clearance: "Muqdisho HQ Clearance",
  ready_for_pickup: "At Muqdisho HQ",
  delivered: "Completed",
};

export const shipmentStatusOptions: Array<{
  label: string;
  value: ShipmentStatus;
}> = [
  { label: shipmentStatusLabels.pending, value: "pending" },
  { label: shipmentStatusLabels.in_warehouse, value: "in_warehouse" },
  { label: shipmentStatusLabels.in_transit, value: "in_transit" },
  { label: shipmentStatusLabels.customs_clearance, value: "customs_clearance" },
  { label: shipmentStatusLabels.ready_for_pickup, value: "ready_for_pickup" },
  { label: shipmentStatusLabels.delivered, value: "delivered" },
];

export function getShipmentLocationLabel(status: ShipmentStatus) {
  switch (status) {
    case "in_warehouse":
      return "China Warehouse - Receiving";
    case "in_transit":
      return "Linehaul to Muqdisho HQ";
    case "customs_clearance":
      return "Muqdisho HQ - Customs Desk";
    case "ready_for_pickup":
      return "Muqdisho HQ - Pickup Desk";
    case "delivered":
      return "Collected or locally delivered";
    default:
      return "Booking desk";
  }
}

export function formatShipmentTimelineStatus(status: string) {
  const normalized = status as ShipmentStatus;
  if (normalized in shipmentStatusLabels) {
    return shipmentStatusLabels[normalized];
  }

  return status
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
