"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";

type NewExpenseFormProps = {
  currencies: Array<{
    code: string;
    label: string;
  }>;
  triggerClassName: string;
};

export function NewExpenseForm({ currencies, triggerClassName }: NewExpenseFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultCurrency = currencies[0]?.code ?? "USD";
  const [form, setForm] = useState({
    amount: "",
    category: "",
    currency: defaultCurrency,
    description: "",
  });

  function closeModal() {
    setIsOpen(false);
    setIsSubmitting(false);
    setError(null);
    setForm({
      amount: "",
      category: "",
      currency: defaultCurrency,
      description: "",
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/v1/expenses", {
      body: JSON.stringify({
        amount: Number(form.amount),
        category: form.category,
        currency: form.currency,
        description: form.description,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Expense save failed.");
      setIsSubmitting(false);
      return;
    }

    closeModal();
    router.refresh();
  }

  return (
    <>
      <button className={triggerClassName} onClick={() => setIsOpen(true)} type="button">
        <Plus className="mr-2 h-4 w-4" />
        New Expense
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
                  Finance
                </p>
                <h2 className="mt-1 font-heading text-2xl font-bold text-primary">
                  New Expense
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
                <span className="font-data text-sm font-bold text-on-surface">Category</span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, category: event.target.value }))
                  }
                  required
                  value={form.category}
                />
              </label>

              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">Description</span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  value={form.description}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="font-data text-sm font-bold text-on-surface">Amount</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                    min="0"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, amount: event.target.value }))
                    }
                    required
                    step="0.01"
                    type="number"
                    value={form.amount}
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

              {error ? <p className="font-data text-sm font-bold text-error">{error}</p> : null}

              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                <Plus className="h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Expense"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
