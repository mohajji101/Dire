"use client";

import { useState } from "react";
import { LoaderCircle, Search, Truck } from "lucide-react";

type TrackingResult = {
  shipment: {
    destination: string;
    expectedArrival: string;
    invoiceStatus: string;
    location: string;
    origin: string;
    shipmentType: string;
    status: string;
    trackingNumber: string;
  };
  timeline: Array<{
    date: string;
    notes: string;
    status: string;
  }>;
};

export function PublicShipmentTracker() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = trackingNumber.trim();
    if (!value) {
      setError("Enter a shipment tracking number.");
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/shipments/track/${encodeURIComponent(value)}`);
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.data) {
        setResult(null);
        setError(payload?.error?.message ?? "Tracking number was not found.");
        setIsLoading(false);
        return;
      }

      setResult(payload.data as TrackingResult);
      setIsLoading(false);
    } catch {
      setResult(null);
      setError("Tracking request failed. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
      <div className="border-b border-outline-variant p-5 md:p-6">
        <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
          Public Tracking
        </p>
        <h2 className="mt-2 font-heading text-2xl font-bold text-primary md:text-3xl">
          Track a shipment
        </h2>
        <p className="mt-2 max-w-2xl font-body text-sm text-on-surface-variant md:text-base">
          Enter the tracking number you received from Dire Cargo to check the current stage,
          route, and final handoff readiness.
        </p>
      </div>

      <div className="p-5 md:p-6">
        <form className="grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
          <label className="relative block">
            <span className="sr-only">Tracking number</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-low px-9 font-data text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              onChange={(event) => setTrackingNumber(event.target.value)}
              placeholder="AWB-123456 or BAS-123456"
              value={trackingNumber}
            />
          </label>
          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-data text-sm font-bold text-on-primary disabled:opacity-60"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
            {isLoading ? "Checking..." : "Track"}
          </button>
        </form>

        {error ? <p className="mt-3 font-data text-sm font-bold text-error">{error}</p> : null}

        {result ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
              <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                Shipment
              </p>
              <p className="mt-2 font-heading text-2xl font-bold text-primary">
                {result.shipment.trackingNumber}
              </p>

              <div className="mt-4 grid gap-3">
                {[
                  { label: "Status", value: result.shipment.status.replaceAll("_", " ") },
                  { label: "Current location", value: result.shipment.location },
                  { label: "Type", value: result.shipment.shipmentType.replaceAll("_", " ") },
                  { label: "Route", value: `${result.shipment.origin} to ${result.shipment.destination}` },
                  { label: "Invoice", value: result.shipment.invoiceStatus },
                  { label: "ETA", value: result.shipment.expectedArrival || "Pending update" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                      {item.label}
                    </p>
                    <p className="mt-1 font-data text-sm font-bold capitalize text-on-surface">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
              <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                Timeline
              </p>
              <div className="mt-4">
                {result.timeline.map((event, index) => (
                  <div
                    className="relative flex gap-4 pb-6 last:pb-0"
                    key={`${event.date}-${event.status}-${index}`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="h-3.5 w-3.5 rounded-full bg-secondary-container ring-4 ring-yellow-100" />
                      {index < result.timeline.length - 1 ? (
                        <span className="mt-2 h-full w-0.5 bg-outline-variant" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="font-data text-sm font-bold text-on-surface">{event.status}</p>
                      <p className="mt-1 font-body text-sm text-on-surface-variant">{event.notes}</p>
                      <p className="mt-2 font-data text-xs font-semibold text-on-surface-variant">
                        {event.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
