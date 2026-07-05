"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { customerTypeOptions } from "@/lib/customer-types";

type NewCustomerFormProps = {
  triggerClassName: string;
};

const initialForm = {
  address: "",
  city: "",
  companyName: "",
  country: "Somalia",
  customerType: "business",
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
};

export function NewCustomerForm({ triggerClassName }: NewCustomerFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  function closeModal() {
    setIsOpen(false);
    setIsSubmitting(false);
    setError(null);
    setForm(initialForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/v1/customers", {
      body: JSON.stringify(form),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(payload?.error?.message ?? "Customer creation failed.");
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
        New Customer
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
                  Customer
                </p>
                <h2 className="mt-1 font-heading text-2xl font-bold text-primary">
                  New Customer
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

            <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">Type</span>
                <select
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      customerType: event.target.value,
                    }))
                  }
                  value={form.customerType}
                >
                  {customerTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">
                  Company Name
                </span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  placeholder="Required for business, government, and NGO"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      companyName: event.target.value,
                    }))
                  }
                  value={form.companyName}
                />
              </label>

              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">
                  First Name
                </span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, firstName: event.target.value }))
                  }
                  required
                  value={form.firstName}
                />
              </label>

              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">
                  Last Name
                </span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, lastName: event.target.value }))
                  }
                  value={form.lastName}
                />
              </label>

              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">Email</span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  required
                  type="email"
                  value={form.email}
                />
              </label>

              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">Phone</span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  required
                  value={form.phone}
                />
              </label>

              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">Country</span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, country: event.target.value }))
                  }
                  required
                  value={form.country}
                />
              </label>

              <label className="block">
                <span className="font-data text-sm font-bold text-on-surface">City</span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, city: event.target.value }))
                  }
                  required
                  value={form.city}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="font-data text-sm font-bold text-on-surface">Address</span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, address: event.target.value }))
                  }
                  value={form.address}
                />
              </label>

              {error ? (
                <p className="font-data text-sm font-bold text-error md:col-span-2">
                  {error}
                </p>
              ) : null}

              <div className="md:col-span-2">
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  <Plus className="h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
