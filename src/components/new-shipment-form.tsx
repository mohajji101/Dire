"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Calculator, PackagePlus } from "lucide-react";

type CustomerOption = {
  id: string;
  label: string;
};

type NewShipmentFormProps = {
  customers: CustomerOption[];
};

type FormState = {
  cbm: string;
  commodity: string;
  customerId: string;
  description: string;
  destinationCountry: string;
  expectedArrival: string;
  originCountry: string;
  packageCount: string;
  shipmentType: "AIR" | "SEA" | "BUY_AND_SHIP";
  weight: string;
};

const initialState: FormState = {
  cbm: "",
  commodity: "",
  customerId: "",
  description: "",
  destinationCountry: "Somalia",
  expectedArrival: "",
  originCountry: "China",
  packageCount: "1",
  shipmentType: "AIR",
  weight: "",
};

export function NewShipmentForm({ customers }: NewShipmentFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/v1/shipments", {
      body: JSON.stringify({
        commodity: form.commodity,
        customerId: form.customerId,
        description: form.description,
        destinationCountry: form.destinationCountry,
        expectedArrival: form.expectedArrival,
        originCountry: form.originCountry,
        packageCount: Number(form.packageCount || "1"),
        packages: [
          {
            volume: form.cbm ? Number(form.cbm) : 0,
            weight: Number(form.weight),
          },
        ],
        shipmentType: form.shipmentType,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(
        payload?.error?.message ??
          "Shipment creation failed. Check service role config and Supabase policies.",
      );
      setIsSubmitting(false);
      return;
    }

    router.push(`/shipments/${payload.data.id}`);
    router.refresh();
  }

  const estimatedCbm = form.cbm ? Number(form.cbm || "0") : 0;
  const estimatedPackageCount = Number(form.packageCount || "1");
  const estimatedWeight = form.weight ? Number(form.weight || "0") : 0;
  const measurementHelp =
    form.shipmentType === "SEA"
      ? "Sea shipment-kan volume/CBM ayaa ugu weyn, laakiin weight-ka dhabta ahna waa in la qoro."
      : form.shipmentType === "BUY_AND_SHIP"
        ? "Buy & Ship shipment-kan qor waxa alaabtu tahay iyo miisaanka/volume-ka la helay marka la ururiyo."
        : "Air shipment-kan miisaanka kg ayaa ugu weyn. Sharax waxa alaabta tahay si ops iyo finance ay u fahmaan.";

  return (
    <form
      className="grid gap-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:grid-cols-2"
      onSubmit={handleSubmit}
    >
      <label className="block">
        <span className="font-data text-sm font-bold text-on-surface">Customer</span>
        <select
          className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          onChange={(event) =>
            setForm((current) => ({ ...current, customerId: event.target.value }))
          }
          value={form.customerId}
        >
          <option value="">Select customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="font-data text-sm font-bold text-on-surface">
          Shipment Type
        </span>
        <select
          className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              shipmentType: event.target.value as FormState["shipmentType"],
            }))
          }
          value={form.shipmentType}
        >
          <option value="AIR">AIR</option>
          <option value="SEA">SEA</option>
          <option value="BUY_AND_SHIP">BUY_AND_SHIP</option>
        </select>
      </label>

      <label className="block">
        <span className="font-data text-sm font-bold text-on-surface">Origin</span>
        <input
          className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          onChange={(event) =>
            setForm((current) => ({ ...current, originCountry: event.target.value }))
          }
          placeholder="China"
          value={form.originCountry}
        />
      </label>

      <label className="block">
        <span className="font-data text-sm font-bold text-on-surface">
          Destination
        </span>
        <input
          className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              destinationCountry: event.target.value,
            }))
          }
          placeholder="Somalia"
          value={form.destinationCountry}
        />
      </label>

      <label className="block md:col-span-2">
        <span className="font-data text-sm font-bold text-on-surface">
          Commodity / Product
        </span>
        <input
          className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          onChange={(event) =>
            setForm((current) => ({ ...current, commodity: event.target.value }))
          }
          placeholder="Electronics spare parts, fabric rolls, office chairs..."
          value={form.commodity}
        />
      </label>

      <label className="block md:col-span-2">
        <span className="font-data text-sm font-bold text-on-surface">
          Cargo Description
        </span>
        <textarea
          className="mt-2 min-h-24 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 font-data text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          onChange={(event) =>
            setForm((current) => ({ ...current, description: event.target.value }))
          }
          placeholder="Describe quantity, packaging style, brand, color, fragile notes, or any handling notes."
          value={form.description}
        />
      </label>

      <label className="block">
        <span className="font-data text-sm font-bold text-on-surface">Package Count</span>
        <input
          className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          min="1"
          onChange={(event) =>
            setForm((current) => ({ ...current, packageCount: event.target.value }))
          }
          step="1"
          type="number"
          value={form.packageCount}
        />
      </label>

      <label className="block">
        <span className="font-data text-sm font-bold text-on-surface">
          Weight (kg)
        </span>
        <input
          className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          min="0"
          onChange={(event) =>
            setForm((current) => ({ ...current, weight: event.target.value }))
          }
          placeholder="0.00"
          step="0.01"
          type="number"
          value={form.weight}
        />
      </label>

      <label className="block">
        <span className="font-data text-sm font-bold text-on-surface">Volume (CBM)</span>
        <input
          className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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

      <label className="block md:col-span-2">
        <span className="font-data text-sm font-bold text-on-surface">
          Expected Arrival
        </span>
        <input
          className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              expectedArrival: event.target.value,
            }))
          }
          type="date"
          value={form.expectedArrival}
        />
      </label>

      <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4 md:col-span-2">
        <div className="flex items-center gap-2 font-data text-sm font-bold text-on-surface">
          <Calculator className="h-4 w-4 text-primary" />
          Shipment Summary
        </div>
        <p className="mt-2 font-body text-sm text-on-surface-variant">
          Packages: {estimatedPackageCount}, Weight: {estimatedWeight.toFixed(2)} kg, Volume: {estimatedCbm.toFixed(2)} CBM
        </p>
        <p className="mt-2 font-body text-sm text-on-surface-variant">{measurementHelp}</p>
        {form.commodity ? (
          <p className="mt-2 font-data text-xs font-semibold text-on-surface">
            Commodity: {form.commodity}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="font-data text-sm font-bold text-error md:col-span-2">{error}</p>
      ) : null}

      <div className="flex flex-col gap-3 md:col-span-2 md:flex-row">
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          <PackagePlus className="h-4 w-4" />
          {isSubmitting ? "Saving..." : "Save Shipment"}
        </button>
      </div>
    </form>
  );
}
