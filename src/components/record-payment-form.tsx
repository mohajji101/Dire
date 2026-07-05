"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";

type RecordPaymentFormProps = {
  balanceDue: number;
  currency: string;
  invoiceId: string;
  invoiceStatus: "draft" | "pending" | "paid" | "overdue";
};

export function RecordPaymentForm({
  balanceDue,
  currency,
  invoiceId,
  invoiceStatus,
}: RecordPaymentFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    amount: balanceDue > 0 ? balanceDue.toFixed(2) : "",
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "cash",
    referenceNumber: "",
  });
  const isFullyPaid = balanceDue <= 0 || invoiceStatus === "paid";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isFullyPaid) {
      setError("This invoice is already fully paid.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/payments", {
        body: JSON.stringify({
          amount: Number(form.amount),
          currency,
          invoiceId,
          paymentDate: form.paymentDate,
          paymentMethod: form.paymentMethod,
          referenceNumber: form.referenceNumber,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error?.message ?? "Payment creation failed.");
        setIsSubmitting(false);
        return;
      }

      setForm({
        amount: "",
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: "cash",
        referenceNumber: "",
      });
      setIsSubmitting(false);
      window.location.assign(`/invoices/${invoiceId}`);
    } catch {
      setError("Payment request failed. Reload the page and try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
      onSubmit={handleSubmit}
    >
      <h2 className="font-heading text-2xl font-bold text-primary">Record Payment</h2>

      <div className="mt-4 grid gap-4">
        <p className="font-body text-sm text-on-surface-variant">
          Remaining balance:{" "}
          <span className="font-data font-bold text-on-surface">
            {new Intl.NumberFormat("en-US", {
              currency,
              maximumFractionDigits: 2,
              style: "currency",
            }).format(balanceDue)}
          </span>
        </p>

        <label className="block">
          <span className="font-data text-sm font-bold text-on-surface">Amount</span>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              className="rounded-lg border border-outline-variant px-3 py-1 font-data text-xs font-bold text-on-surface"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  amount: Math.max(balanceDue, 0).toFixed(2),
                }))
              }
              type="button"
            >
              Use Full Balance
            </button>
            <button
              className="rounded-lg border border-outline-variant px-3 py-1 font-data text-xs font-bold text-on-surface"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  amount: balanceDue > 0 ? (balanceDue / 2).toFixed(2) : "",
                }))
              }
              type="button"
            >
              Half Payment
            </button>
          </div>
          <input
            className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
            max={Math.max(balanceDue, 0)}
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

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="font-data text-sm font-bold text-on-surface">Method</span>
            <select
              className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  paymentMethod: event.target.value,
                }))
              }
              value={form.paymentMethod}
            >
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="card">Card</option>
            </select>
          </label>

          <label className="block">
            <span className="font-data text-sm font-bold text-on-surface">Date</span>
            <input
              className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
              onChange={(event) =>
                setForm((current) => ({ ...current, paymentDate: event.target.value }))
              }
              required
              type="date"
              value={form.paymentDate}
            />
          </label>
        </div>

        <label className="block">
          <span className="font-data text-sm font-bold text-on-surface">
            Reference Number
          </span>
          <input
            className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                referenceNumber: event.target.value,
              }))
            }
            required
            value={form.referenceNumber}
          />
          <p className="mt-2 font-body text-xs text-on-surface-variant">
            Tusaale: EVC123456, BANK-TRX-7788, CASH-RECEIPT-001
          </p>
        </label>

        {error ? <p className="font-data text-sm font-bold text-error">{error}</p> : null}

        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary disabled:opacity-60"
          disabled={isSubmitting || isFullyPaid}
          type="submit"
        >
          <CreditCard className="h-4 w-4" />
          {isFullyPaid ? "Already Paid" : isSubmitting ? "Saving..." : "Save Payment"}
        </button>
      </div>
    </form>
  );
}
