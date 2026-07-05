"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { customerTypeOptions, isOrganizationCustomerType } from "@/lib/customer-types";

type CustomerProfileFormProps = {
  allowAccountControls?: boolean;
  customer: {
    address: string;
    city: string;
    companyName?: string;
    country: string;
    customerType?: string;
    firstName: string;
    id: string;
    lastName: string;
    phone: string;
    status?: string;
  };
};

export function CustomerProfileForm({
  allowAccountControls = false,
  customer,
}: CustomerProfileFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    address: customer.address,
    city: customer.city,
    companyName: customer.companyName ?? "",
    country: customer.country,
    customerType: customer.customerType ?? "individual",
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    status: customer.status ?? "active",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    if (isOrganizationCustomerType(form.customerType) && !form.companyName.trim()) {
      setError("Company / organization name is required for business, government, and NGO customers.");
      setIsSubmitting(false);
      return;
    }

    const payload = allowAccountControls
      ? form
      : {
          address: form.address,
          city: form.city,
          companyName: form.companyName,
          country: form.country,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
        };

    const response = await fetch(`/api/v1/customers/${customer.id}`, {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    });

    const responsePayload = await response.json().catch(() => null);

    if (!response.ok) {
      setError(responsePayload?.error?.message ?? "Profile update failed.");
      setIsSubmitting(false);
      return;
    }

    setMessage("Profile updated successfully.");
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="font-data text-sm font-bold text-on-surface">First name</span>
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
          <span className="font-data text-sm font-bold text-on-surface">Last name</span>
          <input
            className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
            onChange={(event) =>
              setForm((current) => ({ ...current, lastName: event.target.value }))
            }
            required
            value={form.lastName}
          />
        </label>
      </div>

      <label className="block">
        <span className="font-data text-sm font-bold text-on-surface">
          Company / organization name
        </span>
        <input
          className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
          onChange={(event) =>
            setForm((current) => ({ ...current, companyName: event.target.value }))
          }
          placeholder={
            isOrganizationCustomerType(form.customerType)
              ? "Required for business / government / NGO"
              : "Optional"
          }
          required={isOrganizationCustomerType(form.customerType)}
          value={form.companyName}
        />
      </label>

      {allowAccountControls ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="font-data text-sm font-bold text-on-surface">Customer type</span>
            <select
              className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
              onChange={(event) =>
                setForm((current) => ({ ...current, customerType: event.target.value }))
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
            <span className="font-data text-sm font-bold text-on-surface">Status</span>
            <select
              className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
              onChange={(event) =>
                setForm((current) => ({ ...current, status: event.target.value }))
              }
              value={form.status}
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
        <label className="block">
          <span className="font-data text-sm font-bold text-on-surface">Address</span>
          <input
            className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-data text-sm"
            onChange={(event) =>
              setForm((current) => ({ ...current, address: event.target.value }))
            }
            required
            value={form.address}
          />
        </label>
      </div>

      {error ? (
        <p className="font-data text-sm font-bold text-error">{error}</p>
      ) : null}
      {message ? (
        <p className="font-data text-sm font-bold text-success">{message}</p>
      ) : null}

      <div>
        <button
          className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Saving..." : "Update Profile"}
        </button>
      </div>
    </form>
  );
}
