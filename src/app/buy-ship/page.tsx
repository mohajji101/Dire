import Link from "next/link";
import { ExternalLink, Search, ShoppingCart } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { NewBuyShipForm } from "@/components/new-buy-ship-form";
import { type BuyShipStatus } from "@/lib/demo-data";
import { listBuyShipRequests, listCurrencies, listCustomers } from "@/lib/supabase/dire-data";

const statusClasses: Record<BuyShipStatus, string> = {
  requested: "bg-surface-container-high text-on-surface-variant",
  quoted: "bg-blue-50 text-blue-800",
  awaiting_payment: "bg-yellow-50 text-yellow-800",
  purchased: "bg-indigo-50 text-indigo-800",
  in_warehouse: "bg-orange-50 text-orange-800",
  converted_to_shipment: "bg-emerald-50 text-success",
  cancelled: "bg-red-50 text-error",
};

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

type BuyShipPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
  }>;
};

export default async function BuyShipPage({ searchParams }: BuyShipPageProps) {
  const filters = await searchParams;
  const [{ items: buyShipRequests, mode }, { items: customers }, { items: currencies }] = await Promise.all([
    listBuyShipRequests({
      search: filters.search,
      status: filters.status,
    }),
    listCustomers(),
    listCurrencies(),
  ]);
  const openRequests = buyShipRequests.filter(
    (item) => !["converted_to_shipment", "cancelled"].includes(item.status),
  ).length;
  const awaitingPayment = buyShipRequests.filter(
    (item) => item.paymentStatus === "pending",
  ).length;
  const purchased = buyShipRequests.filter(
    (item) => item.status === "purchased",
  ).length;
  const totalValue = buyShipRequests.reduce(
    (sum, item) => sum + item.estimatedPrice,
    0,
  );

  return (
    <AppShell activeItem="Buy & Ship">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 md:p-6">
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:flex md:items-center md:justify-between md:p-8">
          <div>
            <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
              Buy & Ship
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-primary md:text-4xl">
              Buy & Ship Requests
            </h1>
            <p className="mt-3 max-w-3xl font-body text-base text-on-surface-variant md:text-lg">
              Manage customer purchase links, supplier sourcing, payment state,
              warehouse handoff, and conversion into shipments.
            </p>
          </div>
          <NewBuyShipForm
            customers={customers.map((customer) => ({
              id: customer.id,
              label: `${customer.companyName ?? customer.name} (${customer.customerCode})`,
            }))}
            currencies={currencies.map((currency) => ({
              code: currency.code,
              label: `${currency.code} - ${currency.name}`,
            }))}
            triggerClassName="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary transition hover:bg-primary-container md:mt-0"
          />
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Open Requests", value: openRequests },
            { label: "Awaiting Payment", value: awaitingPayment },
            { label: "Purchased", value: purchased },
            { label: "Estimated Value", value: money(totalValue, "USD") },
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
                Request List
              </h2>
              <p className="mt-1 font-body text-sm text-on-surface-variant">
                {mode === "supabase"
                  ? "Live Buy & Ship requests from Supabase."
                  : "API-ready demo data from `/api/v1/buy-ship`."}
              </p>
            </div>
            <form className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_auto_auto]" method="get">
              <label className="relative">
                <span className="sr-only">Search requests</span>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-low px-9 font-data text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  defaultValue={filters.search ?? ""}
                  name="search"
                  placeholder="Product, customer, supplier..."
                />
              </label>
              <select
                className="h-10 rounded-lg border border-outline-variant bg-surface-container px-3 font-data text-sm font-bold text-on-surface"
                defaultValue={filters.status ?? ""}
                name="status"
              >
                <option value="">All Statuses</option>
                <option value="requested">Requested</option>
                <option value="quoted">Quoted</option>
                <option value="awaiting_payment">Awaiting Payment</option>
                <option value="purchased">Purchased</option>
                <option value="in_warehouse">In Warehouse</option>
                <option value="converted_to_shipment">Converted to Shipment</option>
                <option value="cancelled">Cancelled</option>
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
            <table className="w-full min-w-[1040px] border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  {[
                    "Request",
                    "Product",
                    "Customer",
                    "Supplier",
                    "Qty",
                    "Pricing",
                    "Estimate",
                    "Payment",
                    "Status",
                    "Link",
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
                {buyShipRequests.map((request) => (
                  <tr
                    className="border-b border-surface-container-high transition hover:bg-surface-container-low"
                    key={request.id}
                  >
                    <td className="px-5 py-4">
                      <Link
                        className="inline-flex items-center gap-2 font-data text-sm font-bold text-primary hover:underline"
                        href={`/buy-ship/${request.id}`}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {request.requestNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-data text-sm font-bold text-on-surface">
                      {request.productName}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-data text-sm font-bold text-on-surface">
                        {request.customerName}
                      </p>
                      <p className="mt-1 font-data text-xs text-on-surface-variant">
                        {request.customerCode}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-data text-sm text-on-surface">
                      {request.supplier}
                    </td>
                    <td className="px-5 py-4 font-data text-sm text-on-surface">
                      {request.quantity}
                    </td>
                    <td className="px-5 py-4 font-data text-sm font-semibold capitalize text-on-surface">
                      {request.pricingBasis.replaceAll("_", " ")}
                    </td>
                    <td className="px-5 py-4 font-data text-sm font-bold text-on-surface">
                      {money(request.estimatedPrice, request.currency)}
                    </td>
                    <td className="px-5 py-4 font-data text-sm font-semibold capitalize text-on-surface">
                      {request.paymentStatus.replaceAll("_", " ")}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 font-data text-xs font-bold capitalize ${
                          statusClasses[request.status]
                        }`}
                      >
                        {request.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <a
                        aria-label={`Open supplier link for ${request.requestNumber}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant bg-surface-container text-primary"
                        href={request.purchaseLink}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
