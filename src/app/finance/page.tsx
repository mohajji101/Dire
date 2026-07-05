import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  CreditCard,
  DollarSign,
  ReceiptText,
  Search,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { NewExpenseForm } from "@/components/new-expense-form";
import { getFinanceSummary, listCurrencies, listInvoices } from "@/lib/supabase/dire-data";

function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

type FinancePageProps = {
  searchParams?: Promise<{
    search?: string;
  }>;
};

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const params = (await searchParams) ?? {};
  const [{ items: invoices }, finance, { items: currencies }] = await Promise.all([
    listInvoices(),
    getFinanceSummary(),
    listCurrencies(),
  ]);
  const search = params.search?.trim().toLowerCase() ?? "";
  const filteredPayments = finance.recentPayments.filter((payment) => {
    const invoice = invoices.find((item) => item.id === payment.invoiceId);
    return search.length === 0
      ? true
      : [
          payment.referenceNumber,
          payment.paymentMethod,
          payment.currency,
          invoice?.invoiceNumber,
          invoice?.customerName,
          invoice?.customerCode,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search);
  });
  const filteredExpenses = finance.recentExpenses.filter((expense) =>
    search.length === 0
      ? true
      : [expense.category, expense.description, expense.currency, expense.createdAt]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search),
  );
  const maxRevenue = Math.max(...finance.monthly.map((item) => item.revenue), 1);

  return (
    <AppShell activeItem="Finance">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 md:p-6">
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:flex md:items-center md:justify-between md:p-8">
          <div>
            <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
              Finance
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-primary md:text-4xl">
              Finance Dashboard
            </h1>
            <p className="mt-3 max-w-3xl font-body text-base text-on-surface-variant md:text-lg">
              Monitor revenue, outstanding payments, paid invoices, expenses,
              profit estimates, and currency exposure.
            </p>
          </div>
          <Link
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary transition hover:bg-primary-container md:mt-0"
            href="/invoices"
          >
            <ReceiptText className="h-4 w-4" />
            View Invoices
          </Link>
        </section>

        <form className="max-w-xl" method="get">
          <label className="relative block">
            <span className="sr-only">Search finance records</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-low px-9 font-data text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              defaultValue={params.search ?? ""}
              name="search"
              placeholder="Search payments, invoices, expenses..."
            />
          </label>
        </form>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Total Revenue (USD Eq.)", value: money(finance.revenue), icon: DollarSign },
            { label: "Outstanding (USD Eq.)", value: money(finance.outstanding), icon: CreditCard },
            { label: "Paid Invoices", value: finance.paidInvoices, icon: ReceiptText },
            { label: "Profit Estimate (USD Eq.)", value: money(finance.profitEstimate), icon: TrendingUp },
          ].map((stat) => (
            <article
              className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
              key={stat.label}
            >
              <div className="flex items-center justify-between">
                <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                  {stat.label}
                </p>
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-3 font-heading text-3xl font-bold text-primary">
                {stat.value}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="border-b border-outline-variant p-5">
              <h2 className="font-heading text-2xl font-bold text-primary">
                Income vs Expenses
              </h2>
              <p className="mt-1 font-body text-sm text-on-surface-variant">
                {finance.mode === "supabase"
                  ? "Revenue and expense graph backed by live Supabase invoice and expense records."
                  : "Demo feed from `/api/v1/reports/revenue`."}
              </p>
            </div>
            <div className="space-y-5 p-5">
              {finance.monthly.map((item) => (
                <div className="grid gap-3 md:grid-cols-[56px_1fr_1fr]" key={item.month}>
                  <p className="font-data text-sm font-bold text-on-surface">
                    {item.month}
                  </p>
                  <div>
                    <div className="h-3 rounded-full bg-surface-container-high">
                      <div
                        className="h-3 rounded-full bg-primary"
                        style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 font-data text-xs text-on-surface-variant">
                      Revenue {money(item.revenue)} USD Eq.
                    </p>
                  </div>
                  <div>
                    <div className="h-3 rounded-full bg-surface-container-high">
                      <div
                        className="h-3 rounded-full bg-secondary-container"
                        style={{ width: `${(item.expenses / maxRevenue) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 font-data text-xs text-on-surface-variant">
                      Expenses {money(item.expenses)} USD Eq.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="border-b border-outline-variant p-5">
              <h2 className="font-heading text-2xl font-bold text-primary">
                Recent Payments
              </h2>
              <p className="mt-1 font-body text-sm text-on-surface-variant">
                Payment reconciliation queue.
              </p>
            </div>
            <div className="divide-y divide-surface-container-high">
              {filteredPayments.map((payment) => {
                const invoice = invoices.find(
                  (item) => item.id === payment.invoiceId,
                );

                return (
                  <div className="p-5" key={payment.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-success">
                          <Banknote className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="font-data text-sm font-bold text-primary">
                            {money(payment.amount, payment.currency)}
                          </p>
                          <p className="mt-1 font-body text-sm text-on-surface-variant">
                            {invoice?.invoiceNumber ?? payment.invoiceId}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-on-surface-variant" />
                    </div>
                    <p className="mt-3 font-data text-xs font-semibold capitalize text-on-surface-variant">
                      {payment.paymentMethod.replaceAll("_", " ")} /{" "}
                      {payment.referenceNumber}
                    </p>
                  </div>
                );
              })}
            </div>
          </aside>
        </section>

        <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <aside className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl font-bold text-primary">
                  Expenses
                </h2>
                <p className="mt-1 font-body text-sm text-on-surface-variant">
                  Track operating costs against revenue.
                </p>
              </div>
              <NewExpenseForm
                currencies={currencies.map((currency) => ({
                  code: currency.code,
                  label: `${currency.code} - ${currency.name}`,
                }))}
                triggerClassName="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary"
              />
            </div>
          </aside>

          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="border-b border-outline-variant p-5">
              <h2 className="font-heading text-2xl font-bold text-primary">
                Recent Expenses
              </h2>
            </div>
            <div className="divide-y divide-surface-container-high">
              {filteredExpenses.length ? (
                filteredExpenses.map((expense) => (
                  <div className="flex flex-col gap-2 p-5 md:flex-row md:items-center md:justify-between" key={expense.id}>
                    <div>
                      <p className="font-data text-sm font-bold text-primary">
                        {expense.category}
                      </p>
                      <p className="mt-1 font-body text-sm text-on-surface-variant">
                        {expense.description || "No description"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-data text-sm font-bold text-on-surface">
                        {money(expense.amount, expense.currency)}
                      </p>
                      <p className="mt-1 font-data text-xs text-on-surface-variant">
                        {expense.createdAt}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-5 font-body text-sm text-on-surface-variant">
                  No expenses recorded yet.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
