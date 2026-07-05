"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { GitMerge, TriangleAlert } from "lucide-react";

type MergeCustomerFormProps = {
  currentCustomerCode: string;
  currentCustomerId: string;
  options: Array<{
    customerCode: string;
    id: string;
    label: string;
    portalLinked: boolean;
    shipmentCount: number;
  }>;
};

export function MergeCustomerForm({
  currentCustomerCode,
  currentCustomerId,
  options,
}: MergeCustomerFormProps) {
  const router = useRouter();
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedTarget = useMemo(
    () => options.find((option) => option.id === selectedTargetId) ?? null,
    [options, selectedTargetId],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTargetId) {
      setError("Select the customer record that should remain active.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/v1/customers/merge", {
      body: JSON.stringify({
        sourceCustomerId: currentCustomerId,
        targetCustomerId: selectedTargetId,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error?.message ?? "Customer merge failed.");
      setIsSubmitting(false);
      return;
    }

    setSuccess(
      `Merged ${currentCustomerCode} into ${selectedTarget?.customerCode ?? "selected customer"}.`,
    );
    setIsSubmitting(false);
    router.push(`/customers/${selectedTargetId}`);
    router.refresh();
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="font-data text-sm font-bold text-on-surface">
          Keep this customer record
        </span>
        <select
          className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
          onChange={(event) => setSelectedTargetId(event.target.value)}
          value={selectedTargetId}
        >
          <option value="">Select target customer</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
              {option.portalLinked ? " / Portal linked" : ""}
              {option.shipmentCount > 0 ? ` / ${option.shipmentCount} shipments` : ""}
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-900">
        <div className="flex gap-3">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="font-body text-sm">
            This moves shipments, invoices, Buy & Ship requests, support tickets,
            warehouse receipts, and documents from <strong>{currentCustomerCode}</strong>.
          </div>
        </div>
      </div>

      {error ? (
        <p className="font-data text-sm font-bold text-error">{error}</p>
      ) : null}
      {success ? (
        <p className="font-data text-sm font-bold text-success">{success}</p>
      ) : null}

      <div>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary disabled:opacity-60"
          disabled={isSubmitting || !options.length}
          type="submit"
        >
          <GitMerge className="h-4 w-4" />
          {isSubmitting ? "Merging..." : "Merge Customer"}
        </button>
      </div>
    </form>
  );
}
