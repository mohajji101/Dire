"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";

type CustomerOption = {
  id: string;
  label: string;
};

type CurrencyOption = {
  code: string;
  label: string;
};

type NewBuyShipFormProps = {
  customers: CustomerOption[];
  currencies: CurrencyOption[];
  triggerClassName: string;
};

export function NewBuyShipForm({
  customers,
  currencies,
  triggerClassName,
}: NewBuyShipFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultCurrency = currencies[0]?.code ?? "USD";
  const [form, setForm] = useState({
    currency: defaultCurrency,
    customerId: "",
    estimatedPrice: "",
    pricingBasis: "fixed_total",
    productName: "",
    purchaseLink: "",
    quantity: "1",
    unitPrice: "",
  });
  const hasCustomers = customers.length > 0;

  function closeModal() {
    setIsOpen(false);
    setIsSubmitting(false);
    setError(null);
    setForm({
      currency: defaultCurrency,
      customerId: "",
      estimatedPrice: "",
      pricingBasis: "fixed_total",
      productName: "",
      purchaseLink: "",
      quantity: "1",
      unitPrice: "",
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasCustomers) {
      setError("No live customers are available for Buy & Ship requests yet.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const estimatedPrice =
      form.pricingBasis === "per_item"
        ? Number(form.unitPrice || "0") * Number(form.quantity || "0")
        : Number(form.estimatedPrice);

    const response = await fetch("/api/v1/buy-ship", {
      body: JSON.stringify({
        currency: form.currency,
        customerId: form.customerId,
        estimatedPrice,
        pricingBasis: form.pricingBasis,
        productName: form.productName,
        purchaseLink: form.purchaseLink,
        quantity: Number(form.quantity),
        unitPrice: form.pricingBasis === "per_item" ? Number(form.unitPrice) : undefined,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error?.message ?? "Buy & Ship request creation failed.");
      setIsSubmitting(false);
      return;
    }

    closeModal();
    router.refresh();
  }

  return (
    <>
      <button className={triggerClassName} onClick={() => setIsOpen(true)} type="button">
        <Plus className="h-4 w-4" />
        New Request
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
                  Buy & Ship
                </p>
                <h2 className="mt-1 font-heading text-2xl font-bold text-primary">
                  New Request
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
                  {customers.length === 0 ? (
                    <option disabled value="">
                      No customers configured
                    </option>
                  ) : null}
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">Product</span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, productName: event.target.value }))
                  }
                  required
                  value={form.productName}
                />
              </label>

              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">
                  Purchase Link
                </span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, purchaseLink: event.target.value }))
                  }
                  required
                  type="url"
                  value={form.purchaseLink}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="font-data text-sm font-bold text-on-surface">Qty</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                    min="1"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, quantity: event.target.value }))
                    }
                    required
                    type="number"
                    value={form.quantity}
                  />
                </label>

                <label className="block">
                  <span className="font-data text-sm font-bold text-on-surface">
                    Pricing Basis
                  </span>
                  <select
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        pricingBasis: event.target.value,
                        unitPrice:
                          event.target.value === "per_item" ? current.unitPrice : "",
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
                    min="0"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [form.pricingBasis === "per_item" ? "unitPrice" : "estimatedPrice"]:
                          event.target.value,
                      }))
                    }
                    required
                    step="0.01"
                    type="number"
                    value={
                      form.pricingBasis === "per_item" ? form.unitPrice : form.estimatedPrice
                    }
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

              <p className="font-body text-sm text-on-surface-variant">
                {form.pricingBasis === "per_item"
                  ? `Estimated total: ${new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: form.currency,
                      maximumFractionDigits: 2,
                    }).format(Number(form.unitPrice || "0") * Number(form.quantity || "0"))}`
                  : "Use fixed total when the item is priced as one bundled amount instead of kg or CBM."}
              </p>

              {!hasCustomers ? (
                <p className="font-data text-sm font-bold text-error">
                  No live customers are available yet. Create or sync customers first.
                </p>
              ) : null}

              {error ? <p className="font-data text-sm font-bold text-error">{error}</p> : null}

              <div>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary disabled:opacity-60"
                  disabled={isSubmitting || !hasCustomers}
                  type="submit"
                >
                  <Plus className="h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
