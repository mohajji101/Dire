import Link from "next/link";
import { ArrowLeft, CreditCard, Download, ReceiptText, Truck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RecordPaymentForm } from "@/components/record-payment-form";
import { getInvoiceDetail } from "@/lib/supabase/dire-data";

type InvoiceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  const { id } = await params;
  const detail = await getInvoiceDetail(id);

  if (!detail) {
    return (
      <AppShell activeItem="Invoices">
        <div className="p-6">
          <p className="font-data text-sm font-bold text-error">
            Invoice not found.
          </p>
        </div>
      </AppShell>
    );
  }

  const { invoice, lines, payments } = detail;
  const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balance = invoice.totalAmount - paidAmount;

  return (
    <AppShell activeItem="Invoices">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 p-4 md:p-6">
        <Link
          className="inline-flex w-fit items-center gap-2 font-data text-sm font-bold text-primary hover:underline"
          href="/invoices"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to invoices
        </Link>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:flex md:items-center md:justify-between md:p-8">
          <div>
            <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
              Invoice Detail
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-primary md:text-4xl">
              {invoice.invoiceNumber}
            </h1>
            <p className="mt-3 font-body text-base text-on-surface-variant">
              {invoice.customerName} / {invoice.trackingNumber}
            </p>
          </div>
          <a
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary md:mt-0"
            href={`/invoices/${invoice.id}/viewer`}
          >
            <Download className="h-4 w-4" />
            View PDF
          </a>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="border-b border-outline-variant p-5">
              <h2 className="font-heading text-2xl font-bold text-primary">
                Charges Breakdown
              </h2>
            </div>
            <div className="p-5">
              {lines.map((line) => (
                <div
                  className="flex items-center justify-between border-b border-surface-container-high py-4 last:border-b-0"
                  key={line.label}
                >
                  <p className="font-data text-sm font-semibold text-on-surface">
                    {line.label}
                    {line.includedInTotal === false ? (
                      <span className="ml-2 text-xs font-semibold text-on-surface-variant">
                        Excluded from total
                      </span>
                    ) : null}
                  </p>
                  <p className="font-data text-sm font-bold text-primary">
                    {money(Number(line.amount), invoice.currency)}
                  </p>
                </div>
              ))}
              <div className="mt-5 rounded-lg bg-surface-container-low p-5">
                <div className="flex items-center justify-between">
                  <p className="font-heading text-xl font-bold text-primary">
                    Total
                  </p>
                  <p className="font-heading text-2xl font-bold text-primary">
                    {money(invoice.totalAmount, invoice.currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="grid gap-4">
            {[
              { icon: ReceiptText, label: "Status", value: invoice.status },
              {
                icon: CreditCard,
                label: "Paid",
                value: money(paidAmount, invoice.currency),
              },
              {
                icon: CreditCard,
                label: "Balance",
                value: money(balance, invoice.currency),
              },
              { icon: Truck, label: "Shipment", value: invoice.trackingNumber },
            ].map((item) => (
              <div
                className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
                key={item.label}
              >
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-container-high text-primary">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                      {item.label}
                    </p>
                    <p className="mt-1 font-data text-sm font-bold capitalize text-on-surface">
                      {item.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <RecordPaymentForm
              balanceDue={balance}
              currency={invoice.currency}
              invoiceId={invoice.id}
              invoiceStatus={invoice.status}
            />
          </aside>
        </section>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant p-5">
            <h2 className="font-heading text-2xl font-bold text-primary">
              Payment History
            </h2>
          </div>
          <div className="divide-y divide-surface-container-high">
            {payments.length ? (
              payments.map((payment) => (
                <div
                  className="flex flex-col gap-2 p-5 md:flex-row md:items-center md:justify-between"
                  key={payment.id}
                >
                  <div>
                    <p className="font-data text-sm font-bold text-primary">
                      {money(payment.amount, payment.currency)}
                    </p>
                    <p className="mt-1 font-body text-sm text-on-surface-variant">
                      {payment.paymentMethod.replaceAll("_", " ")} /{" "}
                      {payment.referenceNumber}
                    </p>
                  </div>
                  <p className="font-data text-sm font-semibold text-on-surface">
                    {payment.paymentDate}
                  </p>
                </div>
              ))
            ) : (
              <p className="p-5 font-body text-sm text-on-surface-variant">
                No payments recorded for this invoice.
              </p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
