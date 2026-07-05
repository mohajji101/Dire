"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";

type CustomerOption = {
  id: string;
  label: string;
};

type NewTicketFormProps = {
  customers: CustomerOption[];
  triggerClassName: string;
};

export function NewTicketForm({
  customers,
  triggerClassName,
}: NewTicketFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    customerId: "",
    message: "",
    priority: "normal",
    subject: "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/v1/support/tickets", {
      body: JSON.stringify(form),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error?.message ?? "Ticket creation failed.");
      setIsSubmitting(false);
      return;
    }

    setIsOpen(false);
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <>
      <button className={triggerClassName} onClick={() => setIsOpen(true)} type="button">
        <MessageSquarePlus className="h-4 w-4" />
        New Ticket
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
                  Support
                </p>
                <h2 className="mt-1 font-heading text-2xl font-bold text-primary">
                  New Ticket
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
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">Subject</span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, subject: event.target.value }))
                  }
                  required
                  value={form.subject}
                />
              </label>

              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">Priority</span>
                <select
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, priority: event.target.value }))
                  }
                  value={form.priority}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>

              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">Message</span>
                <textarea
                  className="mt-2 min-h-28 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, message: event.target.value }))
                  }
                  required
                  value={form.message}
                />
              </label>

              {error ? <p className="font-data text-sm font-bold text-error">{error}</p> : null}

              <div>
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  <MessageSquarePlus className="h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
