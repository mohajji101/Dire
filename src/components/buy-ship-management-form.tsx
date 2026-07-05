"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save } from "lucide-react";
import { type BuyShipStatus } from "@/lib/demo-data";
import { isBuyShipLocked, validateBuyShipTransition } from "@/lib/workflow-guards";

type BuyShipManagementFormProps = {
  currencies: Array<{
    code: string;
    label: string;
  }>;
  request: {
    currency: string;
    estimatedPrice: number;
    id: string;
    pricingBasis: "fixed_total" | "per_item";
    productName: string;
    purchaseLink: string;
    quantity: number;
    status: BuyShipStatus;
    unitPrice?: number;
  };
};

const statusOptions: Array<{ label: string; value: BuyShipStatus }> = [
  { label: "Requested", value: "requested" },
  { label: "Quoted", value: "quoted" },
  { label: "Awaiting Payment", value: "awaiting_payment" },
  { label: "Purchased", value: "purchased" },
  { label: "In Warehouse", value: "in_warehouse" },
  { label: "Converted to Shipment", value: "converted_to_shipment" },
  { label: "Cancelled", value: "cancelled" },
];

export function BuyShipManagementForm({ currencies, request }: BuyShipManagementFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    currency: request.currency,
    estimatedPrice: String(request.estimatedPrice),
    pricingBasis: request.pricingBasis,
    productName: request.productName,
    purchaseLink: request.purchaseLink,
    quantity: String(request.quantity),
    status: request.status,
    unitPrice: request.unitPrice ? String(request.unitPrice) : "",
  });
  const isLocked = isBuyShipLocked(request.status);
  const allowedStatusOptions = statusOptions.filter((option) => {
    const transition = validateBuyShipTransition(request.status, option.value);
    return option.value === request.status || transition.ok;
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLocked) {
      setError(
        request.status === "converted_to_shipment"
          ? "This Buy & Ship request has already been converted to a shipment and can no longer be edited here."
          : "This Buy & Ship request has been cancelled and can no longer be edited.",
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const estimatedPrice =
      form.pricingBasis === "per_item"
        ? Number(form.unitPrice || "0") * Number(form.quantity || "0")
        : Number(form.estimatedPrice);

    const response = await fetch(`/api/v1/buy-ship/${request.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currency: form.currency,
        estimatedPrice,
        pricingBasis: form.pricingBasis,
        productName: form.productName,
        purchaseLink: form.purchaseLink,
        quantity: Number(form.quantity),
        status: form.status,
        unitPrice: form.pricingBasis === "per_item" ? Number(form.unitPrice) : undefined,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Buy & Ship update failed.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <form
      className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
      onSubmit={handleSubmit}
    >
      <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
        Manage Request
      </p>

      <label className="mt-3 block">
        <span className="font-data text-sm font-bold text-on-surface">Status</span>
        <select
          className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
          disabled={isLocked || isSubmitting}
          onChange={(event) =>
            setForm((current) => ({ ...current, status: event.target.value as BuyShipStatus }))
          }
          value={form.status}
        >
          {allowedStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block">
        <span className="font-data text-sm font-bold text-on-surface">Product</span>
        <input
          className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
          disabled={isLocked || isSubmitting}
          onChange={(event) =>
            setForm((current) => ({ ...current, productName: event.target.value }))
          }
          value={form.productName}
        />
      </label>

      <label className="mt-4 block">
        <span className="font-data text-sm font-bold text-on-surface">Purchase Link</span>
        <input
          className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
          disabled={isLocked || isSubmitting}
          onChange={(event) =>
            setForm((current) => ({ ...current, purchaseLink: event.target.value }))
          }
          type="url"
          value={form.purchaseLink}
        />
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="font-data text-sm font-bold text-on-surface">Quantity</span>
          <input
            className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
            disabled={isLocked || isSubmitting}
            min="1"
            onChange={(event) =>
              setForm((current) => ({ ...current, quantity: event.target.value }))
            }
            type="number"
            value={form.quantity}
          />
        </label>

        <label className="block">
          <span className="font-data text-sm font-bold text-on-surface">Currency</span>
          <select
            className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
            disabled={isLocked || isSubmitting}
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

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="font-data text-sm font-bold text-on-surface">Pricing Basis</span>
          <select
            className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
            disabled={isLocked || isSubmitting}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                pricingBasis: event.target.value as "fixed_total" | "per_item",
                unitPrice: event.target.value === "per_item" ? current.unitPrice : "",
              }))
            }
            value={form.pricingBasis}
          >
            <option value="fixed_total">Fixed total</option>
            <option value="per_item">Per item</option>
          </select>
        </label>

        <label className="block">
          <span className="font-data text-sm font-bold text-on-surface">
            {form.pricingBasis === "per_item" ? "Unit Price" : "Estimated Total"}
          </span>
          <input
            className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
            disabled={isLocked || isSubmitting}
            min="0"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                [form.pricingBasis === "per_item" ? "unitPrice" : "estimatedPrice"]:
                  event.target.value,
              }))
            }
            step="0.01"
            type="number"
            value={form.pricingBasis === "per_item" ? form.unitPrice : form.estimatedPrice}
          />
        </label>
      </div>

      <p className="mt-3 font-body text-sm text-on-surface-variant">
        {isLocked
          ? request.status === "converted_to_shipment"
            ? "This request has already moved into shipment workflow. Continue it from Shipments and Warehouse."
            : "This request is cancelled and locked from further editing."
          : form.pricingBasis === "per_item"
          ? `Estimated total: ${new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: form.currency,
              maximumFractionDigits: 2,
            }).format(Number(form.unitPrice || "0") * Number(form.quantity || "0"))}`
          : "Use fixed total for items sold as one bundle or one supplier quote instead of kg or CBM."}
      </p>

      {error ? <p className="mt-3 font-data text-sm font-bold text-error">{error}</p> : null}

      <button
        className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary disabled:opacity-60"
        disabled={isLocked || isSubmitting}
        type="submit"
      >
        <Save className="h-4 w-4" />
        {isSubmitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
