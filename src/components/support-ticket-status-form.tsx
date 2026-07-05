"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save } from "lucide-react";
import type { SupportTicket } from "@/lib/demo-data";
import { isSupportLocked, validateSupportTransition } from "@/lib/workflow-guards";

type SupportTicketStatusFormProps = {
  currentPriority: SupportTicket["priority"];
  currentStatus: SupportTicket["status"];
  ticketId: string;
};

export function SupportTicketStatusForm({
  currentPriority,
  currentStatus,
  ticketId,
}: SupportTicketStatusFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    priority: currentPriority,
    status: currentStatus,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLocked = isSupportLocked(currentStatus);
  const allowedStatuses: SupportTicket["status"][] = [
    "open",
    "waiting_customer",
    "resolved",
    "closed",
  ].filter((status) => {
    const transition = validateSupportTransition(currentStatus, status as SupportTicket["status"]);
    return status === currentStatus || transition.ok;
  }) as SupportTicket["status"][];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLocked) {
      setError("This support ticket is already closed and can no longer be edited.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await fetch(`/api/v1/support/tickets/${ticketId}`, {
      body: JSON.stringify(form),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Ticket update failed.");
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
        Update Ticket
      </p>

      <label className="mt-3 block">
        <span className="font-data text-sm font-bold text-on-surface">Status</span>
        <select
          className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
          disabled={isLocked || isSubmitting}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              status: event.target.value as SupportTicket["status"],
            }))
          }
          value={form.status}
        >
          {allowedStatuses.map((status) => (
            <option key={status} value={status}>
              {status === "waiting_customer"
                ? "Waiting Customer"
                : status[0]!.toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block">
        <span className="font-data text-sm font-bold text-on-surface">Priority</span>
        <select
          className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
          disabled={isLocked || isSubmitting}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              priority: event.target.value as SupportTicket["priority"],
            }))
          }
          value={form.priority}
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </label>

      {error ? <p className="mt-3 font-data text-sm font-bold text-error">{error}</p> : null}

      {isLocked ? (
        <p className="mt-3 font-body text-sm text-on-surface-variant">
          This ticket is closed. Reopen the workflow before making further changes.
        </p>
      ) : null}

      <button
        className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary disabled:opacity-60"
        disabled={isLocked || isSubmitting}
        type="submit"
      >
        <Save className="h-4 w-4" />
        {isSubmitting ? "Saving..." : "Save Ticket"}
      </button>
    </form>
  );
}
