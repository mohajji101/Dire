import Link from "next/link";
import { Download, ReceiptText, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { NewInvoiceForm } from "@/components/new-invoice-form";
import { listCurrencies, listCustomers, listInvoices, listShipments } from "@/lib/supabase/dire-data";

const statusClasses = {
  draft: "bg-surface-container-high text-on-surface-variant",
  pending: "bg-yellow-50 text-yellow-800",
  paid: "bg-emerald-50 text-success",
  overdue: "bg-red-50 text-error",
};

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function toUsd(amount: number, currency: string, rates: Map<string, number>) {
  const code = currency.toUpperCase();
  if (code === "USD") {
    return amount;
  }
  const rate = rates.get(code) ?? 0;
  return rate > 0 ? amount * rate : 0;
}

type InvoicesPageProps = {
  searchParams: Promise<{
    currency?: string;
    search?: string;
    status?: string;
  }>;
};

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const filters = await searchParams;
  const [{ items: invoices, mode }, { items: customers }, { items: shipments }, { items: currencies }] =
    await Promise.all([
      listInvoices({
        currency: filters.currency,
        search: filters.search,
        status: filters.status,
      }),
      listCustomers(),
      listShipments(),
      listCurrencies(),
    ]);
  const usdRates = new Map(
    currencies.map((currency) => [currency.code.toUpperCase(), currency.exchangeRateToUsd]),
  );
  usdRates.set("USD", 1);
  const pendingTotal = invoices
    .filter((invoice) => ["pending", "overdue"].includes(invoice.status))
    .reduce(
      (sum, invoice) =>
        sum + toUsd(invoice.balanceDue ?? invoice.totalAmount, invoice.currency, usdRates),
      0,
    );

  return (
    <AppShell activeItem="Invoices">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 md:p-6">
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:flex md:items-center md:justify-between md:p-8">
          <div>
            <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
              Invoices
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-primary md:text-4xl">
              Invoice Management
            </h1>
            <p className="mt-3 max-w-3xl font-body text-base text-on-surface-variant md:text-lg">
              Manage invoice lists, charge breakdowns, payment status, and
              PDF-ready invoice records.
            </p>
          </div>
          <NewInvoiceForm
            customers={customers.map((customer) => ({
              id: customer.id,
              label: `${customer.companyName ?? customer.name} (${customer.customerCode})`,
            }))}
            currencies={currencies.map((currency) => ({
              code: currency.code,
              label: `${currency.code} - ${currency.name}`,
            }))}
            shipments={shipments.map((shipment) => ({
              customerId: customers.find((customer) => customer.customerCode === shipment.customerCode)?.id ?? "",
              id: shipment.id,
              label: `${shipment.trackingNumber} - ${shipment.customer}`,
            }))}
            triggerClassName="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary transition hover:bg-primary-container md:mt-0"
          />
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Total Invoices", value: invoices.length },
            {
              label: "Pending",
              value: invoices.filter((invoice) => invoice.status === "pending")
                .length,
            },
            {
              label: "Overdue",
              value: invoices.filter((invoice) => invoice.status === "overdue")
                .length,
            },
            { label: "Outstanding (USD Eq.)", value: money(pendingTotal, "USD") },
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
                Invoice List
              </h2>
              <p className="mt-1 font-body text-sm text-on-surface-variant">
                {mode === "supabase"
                  ? "Live invoice records from Supabase."
                  : "API-ready demo data from `/api/v1/invoices`."}
              </p>
            </div>
            <form className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_auto_auto_auto]" method="get">
              <label className="relative">
                <span className="sr-only">Search invoices</span>
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-low px-9 font-data text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  defaultValue={filters.search ?? ""}
                  name="search"
                  placeholder="Invoice, customer, tracking..."
                />
              </label>
              <select
                className="h-10 rounded-lg border border-outline-variant bg-surface-container px-3 font-data text-sm font-bold text-on-surface"
                defaultValue={filters.status ?? ""}
                name="status"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
              <select
                className="h-10 rounded-lg border border-outline-variant bg-surface-container px-3 font-data text-sm font-bold text-on-surface"
                defaultValue={filters.currency ?? ""}
                name="currency"
              >
                <option value="">All Currencies</option>
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code}
                  </option>
                ))}
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
                    "Invoice",
                    "Customer",
                    "Shipment",
                    "Amount",
                    "Created",
                    "Due",
                    "Status",
                    "PDF",
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
                {invoices.map((invoice) => (
                  <tr
                    className="border-b border-surface-container-high transition hover:bg-surface-container-low"
                    key={invoice.id}
                  >
                    <td className="px-5 py-4">
                      <Link
                        className="inline-flex items-center gap-2 font-data text-sm font-bold text-primary hover:underline"
                        href={`/invoices/${invoice.id}`}
                      >
                        <ReceiptText className="h-4 w-4" />
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-data text-sm font-bold text-on-surface">
                        {invoice.customerName}
                      </p>
                      <p className="mt-1 font-data text-xs text-on-surface-variant">
                        {invoice.customerCode}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-data text-sm font-semibold text-on-surface">
                      {invoice.trackingNumber}
                    </td>
                    <td className="px-5 py-4 font-data text-sm font-bold text-on-surface">
                      {money(invoice.totalAmount, invoice.currency)}
                    </td>
                    <td className="px-5 py-4 font-data text-sm text-on-surface">
                      {invoice.createdAt}
                    </td>
                    <td className="px-5 py-4 font-data text-sm text-on-surface">
                      {invoice.dueDate}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 font-data text-xs font-bold capitalize ${
                          statusClasses[invoice.status]
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <a
                        aria-label={`View ${invoice.invoiceNumber} PDF`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant bg-surface-container text-primary"
                        href={`/invoices/${invoice.id}/viewer`}
                      >
                        <Download className="h-4 w-4" />
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
