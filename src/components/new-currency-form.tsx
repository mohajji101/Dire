"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";

type NewCurrencyFormProps = {
  triggerClassName: string;
};

export function NewCurrencyForm({ triggerClassName }: NewCurrencyFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    symbol: "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/v1/settings/currencies", {
      body: JSON.stringify(form),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error?.message ?? "Currency save failed.");
      setIsSubmitting(false);
      return;
    }

    setIsOpen(false);
    setIsSubmitting(false);
    setForm({
      code: "",
      name: "",
      symbol: "",
    });
    router.refresh();
  }

  return (
    <>
      <button className={triggerClassName} onClick={() => setIsOpen(true)} type="button">
        <Plus className="h-4 w-4" />
        New Currency
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
                  New Currency
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
              <div className="grid gap-4 md:grid-cols-[120px_1fr]">
                <label className="block">
                  <span className="font-data text-sm font-bold text-on-surface">Code</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm uppercase"
                    maxLength={3}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        code: event.target.value.toUpperCase(),
                      }))
                    }
                    required
                    value={form.code}
                  />
                </label>

                <label className="block">
                  <span className="font-data text-sm font-bold text-on-surface">Name</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    required
                    value={form.name}
                  />
                </label>
              </div>

              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">Symbol</span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, symbol: event.target.value }))
                  }
                  placeholder="e.g. $, Sh, ¥, AED"
                  required
                  value={form.symbol}
                />
              </label>

              {error ? <p className="font-data text-sm font-bold text-error">{error}</p> : null}

              <div>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  <Plus className="h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Currency"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
