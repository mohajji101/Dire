"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";

type Option = {
  code: string;
  label: string;
};

type NewPricingRuleFormProps = {
  currencies: Option[];
  triggerClassName: string;
};

export function NewPricingRuleForm({
  currencies,
  triggerClassName,
}: NewPricingRuleFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    chargeType: "freight",
    currency: currencies[0]?.code ?? "USD",
    maximumValue: "",
    minimumValue: "",
    price: "",
    shipmentType: "AIR",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/v1/settings/pricing-rules", {
      body: JSON.stringify({
        chargeType: form.chargeType,
        currency: form.currency,
        maximumValue: form.maximumValue ? Number(form.maximumValue) : null,
        minimumValue: Number(form.minimumValue),
        price: Number(form.price),
        shipmentType: form.shipmentType,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error?.message ?? "Pricing rule save failed.");
      setIsSubmitting(false);
      return;
    }

    setIsOpen(false);
    setIsSubmitting(false);
      setForm({
      chargeType: "freight",
      currency: currencies[0]?.code ?? "USD",
      maximumValue: "",
      minimumValue: "",
      price: "",
      shipmentType: "AIR",
    });
    router.refresh();
  }

  return (
    <>
      <button className={triggerClassName} onClick={() => setIsOpen(true)} type="button">
        <Plus className="h-4 w-4" />
        Add Rule
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
                  Settings
                </p>
                <h2 className="mt-1 font-heading text-2xl font-bold text-primary">
                  New Pricing Rule
                </h2>
              </div>
              <button
                className="rounded-lg px-3 py-2 font-data text-sm font-semibold text-on-surface-variant"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="font-data text-sm font-bold text-on-surface">
                    Shipment Type
                  </span>
                  <select
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        shipmentType: event.target.value,
                      }))
                    }
                    value={form.shipmentType}
                  >
                    <option value="AIR">AIR</option>
                    <option value="SEA">SEA</option>
                    <option value="BUY_AND_SHIP">BUY & SHIP</option>
                  </select>
                </label>

                <label className="block">
                  <span className="font-data text-sm font-bold text-on-surface">
                    Charge Type
                  </span>
                  <select
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, chargeType: event.target.value }))
                    }
                    value={form.chargeType}
                  >
                    <option value="freight">Freight</option>
                    <option value="minimum_charge">Minimum Charge</option>
                    <option value="handling_fee">Handling Fee</option>
                    <option value="customs_fee">Customs Fee</option>
                    <option value="delivery_fee">Delivery Fee</option>
                  </select>
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
                    {currencies.map((currency, index) => (
                      <option
                        key={`${currency.code}-${currency.label}-${index}`}
                        value={currency.code}
                      >
                        {currency.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="font-data text-sm font-bold text-on-surface">
                    Minimum
                  </span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                    min="0"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        minimumValue: event.target.value,
                      }))
                    }
                    required
                    step="0.01"
                    type="number"
                    value={form.minimumValue}
                  />
                </label>

                <label className="block">
                  <span className="font-data text-sm font-bold text-on-surface">
                    Maximum
                  </span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                    min="0"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        maximumValue: event.target.value,
                      }))
                    }
                    step="0.01"
                    type="number"
                    value={form.maximumValue}
                  />
                </label>

                <label className="block">
                  <span className="font-data text-sm font-bold text-on-surface">Price</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                    min="0"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, price: event.target.value }))
                    }
                    required
                    step="0.01"
                    type="number"
                    value={form.price}
                  />
                </label>
              </div>

              {error ? <p className="font-data text-sm font-bold text-error">{error}</p> : null}

              <div>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  <Plus className="h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
