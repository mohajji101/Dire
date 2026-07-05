"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

type EditCurrencyFormProps = {
  currency: {
    code: string;
    id: string;
    name: string;
    symbol: string;
  };
};

export function EditCurrencyForm({ currency }: EditCurrencyFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(currency);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch(`/api/v1/settings/currencies/${currency.id}`, {
      body: JSON.stringify(form),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error?.message ?? "Currency update failed.");
      setIsSubmitting(false);
      return;
    }

    setIsOpen(false);
    setIsSubmitting(false);
    router.refresh();
  }

  async function handleDelete() {
    const confirmed = window.confirm(`Delete currency "${currency.code}"?`);
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await fetch(`/api/v1/settings/currencies/${currency.id}`, {
      method: "DELETE",
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error?.message ?? "Currency delete failed.");
      setIsSubmitting(false);
      return;
    }

    setIsOpen(false);
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <>
      <button
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container px-3 font-data text-xs font-bold text-on-surface"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
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
                  Edit Currency
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
                  required
                  value={form.symbol}
                />
              </label>

              {error ? <p className="font-data text-sm font-bold text-error">{error}</p> : null}

              <div className="flex items-center justify-between gap-3">
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 font-data text-sm font-bold text-white disabled:opacity-60"
                  disabled={isSubmitting}
                  onClick={handleDelete}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  <Pencil className="h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
