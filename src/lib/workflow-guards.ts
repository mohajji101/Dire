import { buyShipStatusFlow, type BuyShipStatus, type ShipmentStatus, type SupportTicket } from "@/lib/demo-data";

const shipmentFlow: ShipmentStatus[] = [
  "pending",
  "in_warehouse",
  "in_transit",
  "customs_clearance",
  "ready_for_pickup",
  "delivered",
];

const terminalBuyShipStatuses: BuyShipStatus[] = ["converted_to_shipment", "cancelled"];

type WorkflowValidationResult =
  | { ok: true }
  | { message: string; ok: false };

export function isShipmentCompleted(status: string) {
  return status === "delivered";
}

export function validateShipmentTransition(
  currentStatus: string,
  nextStatus: string,
): WorkflowValidationResult {
  if (currentStatus === nextStatus) {
    return { ok: true };
  }

  if (isShipmentCompleted(currentStatus)) {
    return {
      ok: false,
      message:
        "This shipment is already completed. Completed shipments cannot be edited again. Only invoice and payment follow-up should continue if the customer still has an outstanding balance.",
    };
  }

  const currentIndex = shipmentFlow.indexOf(currentStatus as ShipmentStatus);
  const nextIndex = shipmentFlow.indexOf(nextStatus as ShipmentStatus);

  if (currentIndex === -1 || nextIndex === -1) {
    return { ok: false, message: "Shipment status is invalid." };
  }

  if (nextIndex !== currentIndex + 1) {
    return {
      ok: false,
      message:
        "Shipment workflow must follow the correct sequence: Booking Created -> China Warehouse -> In Transit -> Muqdisho HQ Clearance -> At Muqdisho HQ -> Completed.",
    };
  }

  return { ok: true };
}

export function isBuyShipLocked(status: string) {
  return terminalBuyShipStatuses.includes(status as BuyShipStatus);
}

export function validateBuyShipTransition(
  currentStatus: string,
  nextStatus: string,
): WorkflowValidationResult {
  if (currentStatus === nextStatus) {
    return { ok: true };
  }

  if (currentStatus === "converted_to_shipment") {
    return {
      ok: false,
      message:
        "This Buy & Ship request has already been converted to a shipment and can no longer be edited here.",
    };
  }

  if (currentStatus === "cancelled") {
    return {
      ok: false,
      message: "This Buy & Ship request has been cancelled and can no longer be edited.",
    };
  }

  if (nextStatus === "cancelled") {
    return { ok: true };
  }

  const currentIndex = buyShipStatusFlow.indexOf(currentStatus as BuyShipStatus);
  const nextIndex = buyShipStatusFlow.indexOf(nextStatus as BuyShipStatus);

  if (currentIndex === -1 || nextIndex === -1) {
    return { ok: false, message: "Buy & Ship status is invalid." };
  }

  if (nextIndex !== currentIndex + 1) {
    return {
      ok: false,
      message:
        "Buy & Ship workflow must follow the correct sequence: Requested -> Quoted -> Awaiting Payment -> Purchased -> In Warehouse -> Converted to Shipment.",
    };
  }

  return { ok: true };
}

export function isSupportLocked(status: string) {
  return status === "closed";
}

export function validateSupportTransition(
  currentStatus: SupportTicket["status"],
  nextStatus: SupportTicket["status"],
): WorkflowValidationResult {
  if (currentStatus === nextStatus) {
    return { ok: true };
  }

  if (currentStatus === "closed") {
    return {
      ok: false,
      message: "This support ticket is already closed and can no longer be edited.",
    };
  }

  const allowedTransitions: Record<SupportTicket["status"], SupportTicket["status"][]> = {
    open: ["waiting_customer", "resolved"],
    waiting_customer: ["open", "resolved"],
    resolved: ["closed", "open"],
    closed: [],
  };

  if (!allowedTransitions[currentStatus].includes(nextStatus)) {
    return {
      ok: false,
      message:
        "Support ticket workflow must follow the correct sequence: Open -> Waiting Customer -> Resolved -> Closed.",
    };
  }

  return { ok: true };
}
