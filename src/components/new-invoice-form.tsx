"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Calculator, Plus } from "lucide-react";

type Option = {
  id: string;
  label: string;
};

type ShipmentOption = Option & {
  customerId: string;
};

type NewInvoiceFormProps = {
  customers: Option[];
  currencies: Array<{
    code: string;
    label: string;
  }>;
  shipments: ShipmentOption[];
  triggerClassName: string;
};

export function NewInvoiceForm({
  customers,
  currencies,
  shipments,
  triggerClassName,
}: NewInvoiceFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultCurrency = currencies[0]?.code ?? "USD";
  const [form, setForm] = useState({
    currency: defaultCurrency,
    customerId: "",
    customsFee: "",
    customsFeeMode: "included_in_invoice",
    deliveryFee: "",
    handlingFee: "",
    includeCustomsFee: false,
    includeDeliveryFee: false,
    includeHandlingFee: false,
    minimumChargeApplied: false,
    serviceFee: "",
    shipmentId: "",
    subtotal: "",
  });
  const [estimate, setEstimate] = useState<null | {
    currency: string;
    customsFee: number;
    deliveryFee: number;
    freightAmount: number;
    freightRuleFound: boolean;
    handlingFee: number;
    measurementLabel: string;
    measurementValue: number;
    minimumCharge: number;
    minimumChargeApplied: boolean;
    shipmentType: string;
  }>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  async function loadShipmentEstimate(nextShipmentId: string, nextCustomerId: string) {
    setIsEstimating(true);
    try {
      const response = await fetch(
        `/api/v1/invoices/estimate?shipmentId=${encodeURIComponent(nextShipmentId)}`,
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Failed to estimate shipment invoice.");
      }

      const data = payload?.data;
      if (!data) {
        return;
      }

      setEstimate(data);
      setForm((current) => ({
        ...current,
        currency: data.currency ?? current.currency,
        customerId: nextCustomerId || current.customerId,
        customsFee: data.customsFee ? String(data.customsFee) : "",
        deliveryFee: data.deliveryFee ? String(data.deliveryFee) : "",
        handlingFee: data.handlingFee ? String(data.handlingFee) : "",
        includeCustomsFee: false,
        includeDeliveryFee: false,
        includeHandlingFee: data.handlingFee > 0,
        minimumChargeApplied: Boolean(data.minimumChargeApplied),
        subtotal: String(data.freightAmount ?? 0),
      }));
    } catch (estimateError: unknown) {
      setEstimate(null);
      setError(
        estimateError instanceof Error
          ? estimateError.message
          : "Failed to estimate shipment invoice.",
      );
    } finally {
      setIsEstimating(false);
    }
  }

  const includedHandlingFee = form.includeHandlingFee ? Number(form.handlingFee || "0") : 0;
  const includedDeliveryFee = form.includeDeliveryFee ? Number(form.deliveryFee || "0") : 0;
  const includedCustomsFee = form.includeCustomsFee ? Number(form.customsFee || "0") : 0;
  const estimatedTotal =
    Number(form.subtotal || "0") +
    Number(form.serviceFee || "0") +
    includedHandlingFee +
    includedDeliveryFee +
    (form.includeCustomsFee && form.customsFeeMode === "included_in_invoice"
      ? includedCustomsFee
      : 0);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/v1/invoices", {
      body: JSON.stringify({
        currency: form.currency,
        customsFee: form.includeCustomsFee ? Number(form.customsFee || "0") : 0,
        customsFeeMode: form.customsFeeMode,
        customerId: form.customerId,
        deliveryFee: form.includeDeliveryFee ? Number(form.deliveryFee || "0") : 0,
        handlingFee: form.includeHandlingFee ? Number(form.handlingFee || "0") : 0,
        minimumChargeApplied: form.minimumChargeApplied,
        serviceFee: Number(form.serviceFee),
        shipmentId: form.shipmentId || undefined,
        subtotal: Number(form.subtotal),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error?.message ?? "Invoice creation failed.");
      setIsSubmitting(false);
      return;
    }

    setIsOpen(false);
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <>
      <button className={triggerClassName} onClick={() => setIsOpen(true)} type="button">
        <Plus className="h-4 w-4" />
        New Invoice
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
                  Invoice
                </p>
                <h2 className="mt-1 font-heading text-2xl font-bold text-primary">
                  New Invoice
                </h2>
              </div>
              <button
                className="rounded-lg px-3 py-2 font-data text-sm font-semibold text-on-surface-variant"
                onClick={() => {
                  setIsOpen(false);
                  setEstimate(null);
                }}
                type="button"
              >
                Close
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">Customer</span>
                <select
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, customerId: event.target.value }))
                  }
                  required
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
                <span className="font-data text-sm font-bold text-on-surface">Shipment</span>
                <select
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  onChange={(event) => {
                    const nextShipmentId = event.target.value;
                    const nextCustomerId =
                      shipments.find((shipment) => shipment.id === nextShipmentId)?.customerId ?? "";

                    if (!nextShipmentId) {
                      setEstimate(null);
                    } else {
                      void loadShipmentEstimate(nextShipmentId, nextCustomerId);
                    }

                    setForm((current) => ({
                      ...current,
                      customerId: nextCustomerId || current.customerId,
                      customsFee: nextShipmentId ? current.customsFee : "",
                      deliveryFee: nextShipmentId ? current.deliveryFee : "",
                      handlingFee: nextShipmentId ? current.handlingFee : "",
                      includeCustomsFee: nextShipmentId ? current.includeCustomsFee : false,
                      includeDeliveryFee: nextShipmentId ? current.includeDeliveryFee : false,
                      includeHandlingFee: nextShipmentId ? current.includeHandlingFee : false,
                      minimumChargeApplied: nextShipmentId ? current.minimumChargeApplied : false,
                      shipmentId: nextShipmentId,
                      subtotal: nextShipmentId ? current.subtotal : "",
                    }));
                  }}
                  value={form.shipmentId}
                >
                  <option value="">Optional shipment</option>
                  {shipments.map((shipment) => (
                    <option key={shipment.id} value={shipment.id}>
                      {shipment.label}
                    </option>
                  ))}
                </select>
              </label>

              {estimate ? (
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                  <div className="flex items-center gap-2 font-data text-sm font-bold text-on-surface">
                    <Calculator className="h-4 w-4 text-primary" />
                    Shipment Estimate
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-on-surface-variant md:grid-cols-2">
                    <p>Type: {estimate.shipmentType.replaceAll("_", " ")}</p>
                    <p>
                      Basis: {estimate.measurementValue.toFixed(2)} {estimate.measurementLabel}
                    </p>
                    <p>Freight: {estimate.currency} {estimate.freightAmount}</p>
                    <p>
                      Minimum charge: {estimate.minimumCharge > 0 ? `${estimate.currency} ${estimate.minimumCharge}` : "Not configured"}
                    </p>
                  </div>
                  {estimate.minimumChargeApplied ? (
                    <p className="mt-2 font-data text-xs font-bold text-primary">
                      Minimum charge was applied because the base freight was lower.
                    </p>
                  ) : null}
                  {!estimate.freightRuleFound ? (
                    <p className="mt-2 font-data text-xs font-bold text-error">
                      No freight pricing rule matched this shipment. You can still enter the subtotal manually.
                    </p>
                  ) : null}
                </div>
              ) : isEstimating ? (
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4 font-data text-sm font-semibold text-on-surface-variant">
                  Loading shipment estimate...
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="font-data text-sm font-bold text-on-surface">Subtotal</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                    min="0"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, subtotal: event.target.value }))
                    }
                    required
                    step="0.01"
                    type="number"
                    value={form.subtotal}
                  />
                </label>

                <label className="block">
                  <span className="font-data text-sm font-bold text-on-surface">
                    Other Service Fee
                  </span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                    min="0"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, serviceFee: event.target.value }))
                    }
                    required
                    step="0.01"
                    type="number"
                    value={form.serviceFee}
                  />
                </label>

                <label className="block">
                  <span className="font-data text-sm font-bold text-on-surface">Currency</span>
                  <select
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, currency: event.target.value }))
                    }
                    value={form.currency}
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block rounded-lg border border-outline-variant bg-surface-container-low p-4">
                  <span className="flex items-center gap-2 font-data text-sm font-bold text-on-surface">
                    <input
                      checked={form.includeHandlingFee}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          includeHandlingFee: event.target.checked,
                        }))
                      }
                      type="checkbox"
                    />
                    Handling Fee
                  </span>
                  <input
                    className="mt-3 h-11 w-full rounded-lg border border-outline-variant bg-surface-container px-3 font-data text-sm"
                    min="0"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, handlingFee: event.target.value }))
                    }
                    step="0.01"
                    type="number"
                    value={form.handlingFee}
                  />
                </label>

                <label className="block rounded-lg border border-outline-variant bg-surface-container-low p-4">
                  <span className="flex items-center gap-2 font-data text-sm font-bold text-on-surface">
                    <input
                      checked={form.includeCustomsFee}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          includeCustomsFee: event.target.checked,
                        }))
                      }
                      type="checkbox"
                    />
                    Customs Fee
                  </span>
                  <input
                    className="mt-3 h-11 w-full rounded-lg border border-outline-variant bg-surface-container px-3 font-data text-sm"
                    min="0"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, customsFee: event.target.value }))
                    }
                    step="0.01"
                    type="number"
                    value={form.customsFee}
                  />
                  <select
                    className="mt-3 h-11 w-full rounded-lg border border-outline-variant bg-surface-container px-3 font-data text-sm"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        customsFeeMode: event.target.value,
                      }))
                    }
                    value={form.customsFeeMode}
                  >
                    <option value="included_in_invoice">Include In Invoice</option>
                    <option value="paid_directly_by_customer">Paid Directly By Customer</option>
                  </select>
                </label>

                <label className="block rounded-lg border border-outline-variant bg-surface-container-low p-4">
                  <span className="flex items-center gap-2 font-data text-sm font-bold text-on-surface">
                    <input
                      checked={form.includeDeliveryFee}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          includeDeliveryFee: event.target.checked,
                        }))
                      }
                      type="checkbox"
                    />
                    Delivery Fee
                  </span>
                  <input
                    className="mt-3 h-11 w-full rounded-lg border border-outline-variant bg-surface-container px-3 font-data text-sm"
                    min="0"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, deliveryFee: event.target.value }))
                    }
                    step="0.01"
                    type="number"
                    value={form.deliveryFee}
                  />
                </label>
              </div>

              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                <p className="font-data text-sm font-bold text-on-surface">Invoice Total Preview</p>
                <p className="mt-2 font-heading text-2xl font-bold text-primary">
                  {form.currency} {estimatedTotal.toFixed(2)}
                </p>
                {form.includeCustomsFee && form.customsFeeMode === "paid_directly_by_customer" ? (
                  <p className="mt-2 font-data text-xs font-semibold text-on-surface-variant">
                    Customs fee is recorded but excluded from the company invoice total.
                  </p>
                ) : null}
              </div>

              {error ? <p className="font-data text-sm font-bold text-error">{error}</p> : null}

              <div>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  <Plus className="h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
