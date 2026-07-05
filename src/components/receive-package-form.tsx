"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ScanLine } from "lucide-react";
import type { ShipmentType } from "@/lib/demo-data";

type ShipmentOption = {
  customerCode: string;
  id: string;
  kind: "buy_ship_request" | "shipment";
  label: string;
  shipmentType: ShipmentType;
};

type BranchOption = {
  id: string;
  label: string;
};

type WarehouseOption = {
  id: string;
  name: string;
};

type ReceivePackageFormProps = {
  branches: BranchOption[];
  shipments: ShipmentOption[];
  triggerClassName: string;
  warehouses: WarehouseOption[];
};

export function ReceivePackageForm({
  branches,
  shipments,
  triggerClassName,
  warehouses,
}: ReceivePackageFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    cbm: "",
    photoUrl: "",
    shipmentId: "",
    sourceBranchId: "",
    warehouseId: "",
    weight: "",
  });

  const selectedShipment = useMemo(
    () => shipments.find((shipment) => shipment.id === form.shipmentId),
    [form.shipmentId, shipments],
  );
  const hasLocationOptions = branches.length > 0 && warehouses.length > 0;

  function closeModal() {
    setIsOpen(false);
    setError(null);
      setForm({
        cbm: "",
        photoUrl: "",
        shipmentId: "",
        sourceBranchId: "",
        warehouseId: "",
        weight: "",
      });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasLocationOptions) {
      setError(
        "Source branches or receiving warehouses are not configured yet. Add them in Settings first.",
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/v1/warehouse/receive", {
      body: JSON.stringify({
        buyShipRequestId:
          selectedShipment?.kind === "buy_ship_request" ? form.shipmentId : undefined,
        customerCode: selectedShipment?.customerCode ?? "",
        volume:
          selectedShipment?.shipmentType === "SEA" && form.cbm
            ? Number(form.cbm)
            : undefined,
        photoUrl: form.photoUrl || undefined,
        shipmentId: selectedShipment?.kind === "shipment" ? form.shipmentId : undefined,
        sourceBranchId: form.sourceBranchId,
        warehouseId: form.warehouseId,
        weight: Number(form.weight),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Package receive failed.");
      setIsSubmitting(false);
      return;
    }

    closeModal();
    setIsSubmitting(false);
    router.refresh();
  }

  const isBuyShip = selectedShipment?.kind === "buy_ship_request";
  const isSeaShipment = selectedShipment?.shipmentType === "SEA";
  const measurementLabel = isSeaShipment ? "Weight (kg)" : "Weight";
  const helperText = isBuyShip
    ? "Buy & Ship itemkan marka la receive-gareeyo, system-ku wuxuu si automatic ah ugu xiraa request-kiisa kadibna shipment record ayuu ka sameeyaa warehouse flow-ga."
    : isSeaShipment
      ? "Sea shipment-kan wuxuu ku shaqeyn karaa CBM, sidaas darteed gali volume-ka marka uu yaallo. Shipment ID-ga la isticmaalayo waa kii item-ka aad ka dooratay list-ka."
      : "Air shipment-kan wuxuu ku shaqeeyaa miisaanka kg. Shipment ID-ga la isticmaalayo waa kii item-ka aad ka dooratay list-ka.";

  return (
    <>
      <button className={triggerClassName} onClick={() => setIsOpen(true)} type="button">
        <ScanLine className="h-4 w-4" />
        Receive Package
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
                  Warehouse
                </p>
                <h2 className="mt-1 font-heading text-2xl font-bold text-primary">
                  Receive Package
                </h2>
              </div>
              <button
                className="rounded-lg px-3 py-2 font-data text-sm font-semibold text-on-surface-variant"
                onClick={closeModal}
                type="button"
              >
                Close
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">
                  Shipment / Buy & Ship
                </span>
                <select
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, shipmentId: event.target.value }))
                  }
                  required
                  value={form.shipmentId}
                >
                  <option value="">Select shipment or Buy &amp; Ship item</option>
                  {shipments.map((shipment) => (
                    <option key={shipment.id} value={shipment.id}>
                      {shipment.label}
                    </option>
                  ))}
                </select>
              </label>

              {selectedShipment ? (
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 font-data text-xs font-bold text-primary">
                      {selectedShipment.kind === "buy_ship_request"
                        ? "Buy & Ship Request"
                        : selectedShipment.shipmentType === "SEA"
                          ? "Sea / CBM Shipment"
                          : selectedShipment.shipmentType === "BUY_AND_SHIP"
                            ? "Buy & Ship Shipment"
                            : "Air / Weight Shipment"}
                    </span>
                    <span className="font-data text-xs font-semibold text-on-surface-variant">
                      Record ID: {selectedShipment.id}
                    </span>
                  </div>
                  <p className="mt-2 font-body text-sm text-on-surface-variant">
                    {helperText}
                  </p>
                </div>
              ) : null}

              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">
                  Source Office / Branch
                </span>
                <select
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sourceBranchId: event.target.value,
                    }))
                  }
                  required
                  value={form.sourceBranchId}
                >
                  <option value="">Select source office or branch</option>
                  {branches.length === 0 ? (
                    <option disabled value="">
                      No source branches configured
                    </option>
                  ) : null}
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">
                  Receiving Warehouse
                </span>
                <select
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sourceBranchId:
                        current.sourceBranchId === event.target.value
                          ? ""
                          : current.sourceBranchId,
                      warehouseId: event.target.value,
                    }))
                  }
                  required
                  value={form.warehouseId}
                >
                  <option value="">Select receiving warehouse</option>
                  {warehouses.length === 0 ? (
                    <option disabled value="">
                      No receiving warehouses configured
                    </option>
                  ) : null}
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">
                  {measurementLabel}
                </span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  min="0"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, weight: event.target.value }))
                  }
                  required
                  step="0.01"
                  type="number"
                  value={form.weight}
                />
              </label>

              {isSeaShipment ? (
                <label className="block">
                  <span className="font-data text-sm font-bold text-on-surface">
                    Volume (CBM)
                  </span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                    min="0"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, cbm: event.target.value }))
                    }
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                    value={form.cbm}
                  />
                </label>
              ) : null}

              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">
                  Photo URL
                </span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, photoUrl: event.target.value }))
                  }
                  placeholder="Optional"
                  type="url"
                  value={form.photoUrl}
                />
              </label>

              {selectedShipment ? (
                <div className="space-y-1 font-data text-xs font-semibold text-on-surface-variant">
                  <p>Customer code: {selectedShipment.customerCode}</p>
                  <p>
                    Record the source office or branch and the receiving warehouse
                    for this package handoff.
                  </p>
                  {isSeaShipment && form.cbm ? <p>Recorded CBM: {form.cbm}</p> : null}
                </div>
              ) : null}

              {!hasLocationOptions ? (
                <p className="font-data text-sm font-bold text-error">
                  Source branches or receiving warehouses are not available yet.
                  Add them in Settings before saving warehouse receipts.
                </p>
              ) : null}

              {error ? <p className="font-data text-sm font-bold text-error">{error}</p> : null}

              <div>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary disabled:opacity-60"
                  disabled={isSubmitting || !hasLocationOptions}
                  type="submit"
                >
                  <ScanLine className="h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Receive Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
