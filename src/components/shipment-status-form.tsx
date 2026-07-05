"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Truck } from "lucide-react";
import { shipmentStatusOptions } from "@/lib/shipment-status";
import { isShipmentCompleted, validateShipmentTransition } from "@/lib/workflow-guards";

type ShipmentStatusFormProps = {
  completionPolicy?: {
    balanceDue: number;
    currency: string;
    hasInvoice: boolean;
    invoiceNumber: string | null;
    paymentStatus: "paid" | "pending" | "unbilled";
  };
  currentStatus: string;
  shipmentId: string;
};

export function ShipmentStatusForm({
  completionPolicy,
  currentStatus,
  shipmentId,
}: ShipmentStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [completionMethod, setCompletionMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLocked = isShipmentCompleted(currentStatus);
  const canCompleteShipment =
    !completionPolicy?.hasInvoice || (completionPolicy.balanceDue ?? 0) <= 0;
  const allowedOptions = shipmentStatusOptions.filter((option) => {
    if (option.value === "delivered" && !canCompleteShipment) {
      return false;
    }

    const transition = validateShipmentTransition(currentStatus, option.value);
    return option.value === currentStatus || transition.ok;
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLocked) {
      setError("This shipment is already completed and cannot be edited again.");
      return;
    }

    if (status === "delivered" && !completionMethod) {
      setError("Select final handoff method: customer pickup or local delivery.");
      return;
    }

    if (status === "delivered" && !canCompleteShipment) {
      setError(
        `Shipment cannot be completed until invoice ${
          completionPolicy?.invoiceNumber ?? ""
        } is fully paid. Remaining balance: ${new Intl.NumberFormat("en-US", {
          currency: completionPolicy?.currency ?? "USD",
          maximumFractionDigits: 2,
          style: "currency",
        }).format(completionPolicy?.balanceDue ?? 0)}.`,
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const finalNotes =
      status === "delivered"
        ? [
            completionMethod === "pickup"
              ? "Final handoff completed via customer pickup at Muqdisho HQ."
              : "Final handoff completed via local delivery to the customer.",
            notes.trim(),
          ]
            .filter(Boolean)
            .join(" ")
        : notes;

    const response = await fetch(`/api/v1/shipments/${shipmentId}/status`, {
      body: JSON.stringify({ notes: finalNotes, status }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error?.message ?? "Shipment status update failed.");
      setIsSubmitting(false);
      return;
    }

    setCompletionMethod("");
    setNotes("");
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <form
      className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
      onSubmit={handleSubmit}
    >
      <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
        Status Update
      </p>

      <label className="mt-3 block">
        <span className="font-data text-sm font-bold text-on-surface">Status</span>
        <select
          className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
          disabled={isLocked || isSubmitting}
          onChange={(event) => setStatus(event.target.value)}
          value={status}
        >
          {allowedOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <p className="mt-3 font-body text-sm text-on-surface-variant">
        {isLocked
          ? "This shipment is already completed. Further workflow edits are locked."
          : status === "ready_for_pickup"
          ? "Shipment has reached Muqdisho HQ and is 95% complete. Final handoff still remains."
          : status === "delivered"
            ? "Mark this only after the customer has collected the cargo or local delivery has been completed."
            : "Update the shipment stage as cargo moves through the workflow."}
      </p>

      {!isLocked && completionPolicy?.hasInvoice && !canCompleteShipment ? (
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="font-data text-sm font-bold text-yellow-900">
            Final completion is blocked until the linked invoice is fully paid.
          </p>
          <p className="mt-1 font-body text-sm text-yellow-800">
            {completionPolicy.invoiceNumber ?? "Linked invoice"} still has a remaining balance of{" "}
            {new Intl.NumberFormat("en-US", {
              currency: completionPolicy.currency,
              maximumFractionDigits: 2,
              style: "currency",
            }).format(completionPolicy.balanceDue)}
            .
          </p>
        </div>
      ) : null}

      {status === "delivered" ? (
        <label className="mt-4 block">
          <span className="font-data text-sm font-bold text-on-surface">
            Final handoff
          </span>
          <select
            className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
            disabled={isLocked || isSubmitting}
            onChange={(event) => setCompletionMethod(event.target.value)}
            value={completionMethod}
          >
            <option value="">Select handoff method</option>
            <option value="pickup">Customer Pickup</option>
            <option value="delivery">Local Delivery</option>
          </select>
        </label>
      ) : null}

      <label className="mt-4 block">
        <span className="font-data text-sm font-bold text-on-surface">Notes</span>
        <textarea
          className="mt-2 min-h-24 w-full rounded-lg border border-outline-variant bg-surface-container-low p-3 font-data text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          disabled={isLocked || isSubmitting}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional timeline note..."
          value={notes}
        />
      </label>

      {error ? <p className="mt-3 font-data text-sm font-bold text-error">{error}</p> : null}

      <button
        className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary disabled:opacity-60"
        disabled={isLocked || isSubmitting}
        type="submit"
      >
        <Truck className="h-4 w-4" />
        {isSubmitting ? "Updating..." : "Update Status"}
      </button>
    </form>
  );
}
