import Link from "next/link";
import { Building2, Search, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { NewCustomerForm } from "@/components/new-customer-form";
import { customerTypeOptions, getCustomerTypeLabel, isOrganizationCustomerType } from "@/lib/customer-types";
import { listCustomers } from "@/lib/supabase/dire-data";

const statusClasses = {
  active: "bg-emerald-50 text-success",
  pending: "bg-yellow-50 text-yellow-800",
  suspended: "bg-red-50 text-error",
};

const portalClasses = {
  linked: "bg-blue-50 text-blue-700",
  unlinked: "bg-surface-container-high text-on-surface-variant",
};

type CustomersPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    type?: string;
  }>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const filters = await searchParams;
  const { items: customers, mode } = await listCustomers({
    search: filters.search,
    status: filters.status,
    type: filters.type,
  });

  const businessCount = customers.filter(
    (customer) => customer.customerType === "business",
  ).length;
  const pendingCount = customers.filter(
    (customer) => customer.status === "pending",
  ).length;
  const documentsCount = customers.reduce(
    (sum, customer) => sum + customer.documents,
    0,
  );
  const portalLinkedCount = customers.filter((customer) => customer.portalLinked).length;

  return (
    <AppShell activeItem="Customers">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 md:p-6">
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:flex md:items-center md:justify-between md:p-8">
          <div>
            <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
              Customers
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-primary md:text-4xl">
              Customer Management
            </h1>
            <p className="mt-3 max-w-3xl font-body text-base text-on-surface-variant md:text-lg">
              Manage customer profiles, suite numbers, shipment history,
              financial summaries, and documents.
            </p>
          </div>
          <NewCustomerForm
            triggerClassName="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary transition hover:bg-primary-container md:mt-0"
          />
        </section>

        <section className="grid gap-4 md:grid-cols-5">
          {[
            { label: "Total Customers", value: customers.length },
            { label: "Business Accounts", value: businessCount },
            { label: "Pending Review", value: pendingCount },
            { label: "Portal Linked", value: portalLinkedCount },
            { label: "Documents", value: documentsCount },
          ].map((stat) => (
            <article
              className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
              key={stat.label}
            >
              <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                {stat.label}
              </p>
              <p className="mt-3 font-heading text-3xl font-bold text-primary">
                {stat.value}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="flex flex-col gap-4 border-b border-outline-variant p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold text-primary">
                Customer List
              </h2>
              <p className="mt-1 font-body text-sm text-on-surface-variant">
                {mode === "supabase"
                  ? "Live customer records from Supabase."
                  : "API-ready demo data from `/api/v1/customers`."}
              </p>
            </div>
            <form className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_auto_auto_auto]" method="get">
              <label className="relative">
                <span className="sr-only">Search customers</span>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-low px-9 font-data text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  defaultValue={filters.search ?? ""}
                  name="search"
                  placeholder="Code, name, company, phone..."
                />
              </label>
              <select
                className="h-10 rounded-lg border border-outline-variant bg-surface-container px-3 font-data text-sm font-bold text-on-surface"
                defaultValue={filters.type ?? ""}
                name="type"
              >
                <option value="">All Types</option>
                {customerTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-lg border border-outline-variant bg-surface-container px-3 font-data text-sm font-bold text-on-surface"
                defaultValue={filters.status ?? ""}
                name="status"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
              <button
                className="inline-flex h-10 items-center justify-center rounded-lg border border-outline-variant bg-surface-container px-4 font-data text-sm font-bold text-on-surface"
                type="submit"
              >
                Filter
              </button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  {[
                    "Customer",
                    "Code / Suite",
                    "Type",
                    "Contact",
                    "Portal",
                    "Location",
                    "Shipments",
                    "Balance",
                    "Status",
                  ].map((heading) => (
                    <th
                      className="px-5 py-4 text-left font-data text-xs font-bold uppercase tracking-wide text-on-surface-variant"
                      key={heading}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => {
                  return (
                    <tr
                      className="border-b border-surface-container-high transition hover:bg-surface-container-low"
                      key={customer.id}
                    >
                      <td className="px-5 py-4">
                        <Link
                          className="inline-flex items-center gap-3 font-data text-sm font-bold text-primary hover:underline"
                          href={`/customers/${customer.id}`}
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high text-primary">
                            {isOrganizationCustomerType(customer.customerType) ? (
                              <Building2 className="h-4 w-4" />
                            ) : (
                              <UserRound className="h-4 w-4" />
                            )}
                          </span>
                          <span>
                            <span className="block">{customer.companyName ?? customer.name}</span>
                            <span className="mt-1 block font-data text-xs font-semibold text-on-surface-variant">
                              {customer.name}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-4 font-data text-sm text-on-surface">
                        <p className="font-bold">{customer.customerCode}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {customer.suiteNumber}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-data text-sm font-semibold capitalize text-on-surface">
                        {getCustomerTypeLabel(customer.customerType)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-data text-sm font-semibold text-on-surface">
                          {customer.email}
                        </p>
                        <p className="mt-1 font-data text-xs text-on-surface-variant">
                          {customer.phone}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 font-data text-xs font-bold ${
                            customer.portalLinked
                              ? portalClasses.linked
                              : portalClasses.unlinked
                          }`}
                        >
                          {customer.portalLinked ? "Linked" : "Not Linked"}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-data text-sm text-on-surface">
                        {customer.city}, {customer.country}
                      </td>
                      <td className="px-5 py-4 font-data text-sm font-bold text-on-surface">
                        {customer.shipmentCount}
                      </td>
                      <td className="px-5 py-4 font-data text-sm font-bold text-on-surface">
                        {customer.outstandingBalance}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 font-data text-xs font-bold capitalize ${
                            statusClasses[customer.status]
                          }`}
                        >
                          {customer.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
