"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";

type Option = {
  code: string;
  label: string;
};

type NewExchangeRateFormProps = {
  currencies: Option[];
  triggerClassName: string;
};

export function NewExchangeRateForm({
  currencies,
  triggerClassName,
}: NewExchangeRateFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    effectiveDate: new Date().toISOString().slice(0, 10),
    fromCurrency: currencies[0]?.code ?? "USD",
    rate: "",
    toCurrency: "USD",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/v1/settings/exchange-rates", {
      body: JSON.stringify({
        ...form,
        rate: Number(form.rate),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error?.message ?? "Exchange rate save failed.");
      setIsSubmitting(false);
      return;
    }

    setIsOpen(false);
    setIsSubmitting(false);
    setForm({
      effectiveDate: new Date().toISOString().slice(0, 10),
      fromCurrency: currencies[0]?.code ?? "USD",
      rate: "",
      toCurrency: "USD",
    });
    router.refresh();
  }

  return (
    <>
      <button className={triggerClassName} onClick={() => setIsOpen(true)} type="button">
        <Plus className="h-4 w-4" />
        Add Rate
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
                  New Exchange Rate
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
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="font-data text-sm font-bold text-on-surface">
                    From Currency
                  </span>
                  <select
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fromCurrency: event.target.value,
                      }))
                    }
                    value={form.fromCurrency}
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

                <label className="block">
                  <span className="font-data text-sm font-bold text-on-surface">To</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                    disabled
                    value={form.toCurrency}
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="font-data text-sm font-bold text-on-surface">Rate</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                    min="0.000001"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, rate: event.target.value }))
                    }
                    required
                    step="0.000001"
                    type="number"
                    value={form.rate}
                  />
                </label>

                <label className="block">
                  <span className="font-data text-sm font-bold text-on-surface">
                    Effective Date
                  </span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        effectiveDate: event.target.value,
                      }))
                    }
                    required
                    type="date"
                    value={form.effectiveDate}
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
                  {isSubmitting ? "Saving..." : "Save Rate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
