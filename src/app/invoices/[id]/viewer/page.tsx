import Link from "next/link";
import { ArrowLeft, CreditCard, FileText, ReceiptText, Truck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PrintInvoiceButton } from "@/components/print-invoice-button";
import { getInvoiceDetail } from "@/lib/supabase/dire-data";

type InvoiceViewerPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function InvoiceViewerPage({
  params,
}: InvoiceViewerPageProps) {
  const { id } = await params;
  const detail = await getInvoiceDetail(id);

  if (!detail) {
    return (
      <AppShell activeItem="Invoices">
        <div className="p-6">
          <p className="font-data text-sm font-bold text-error">Invoice not found.</p>
        </div>
      </AppShell>
    );
  }

  const { invoice, lines, payments } = detail;
  const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balance = invoice.totalAmount - paidAmount;

  function money(value: number, currency: string) {
    return new Intl.NumberFormat("en-US", {
      currency,
      maximumFractionDigits: 0,
      style: "currency",
    }).format(value);
  }

  return (
    <AppShell activeItem="Invoices">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3">
            <Link
              className="inline-flex w-fit items-center gap-2 font-data text-sm font-bold text-primary hover:underline"
              href={`/invoices/${id}`}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to invoice
            </Link>
            <div>
              <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
                Invoice Preview
              </p>
              <h1 className="mt-2 font-heading text-3xl font-bold text-primary md:text-4xl">
                {invoice.invoiceNumber}
              </h1>
            </div>
          </div>

          <PrintInvoiceButton />
        </div>

        <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm print:border-0 print:shadow-none">
          <div className="flex items-center gap-3 border-b border-outline-variant px-5 py-4 print:hidden">
            <FileText className="h-5 w-5 text-primary" />
            <p className="font-data text-sm font-bold text-on-surface">
              Printable Invoice View
            </p>
          </div>
          <div className="bg-white p-6 md:p-10 print:p-0">
            <div className="grid gap-6 border-b border-outline-variant pb-6 md:grid-cols-[1fr_auto]">
              <div>
                <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
                  Dire Cargo Logistics
                </p>
                <h2 className="mt-2 font-heading text-3xl font-bold text-primary">
                  {invoice.invoiceNumber}
                </h2>
                <p className="mt-2 font-body text-sm text-on-surface-variant">
                  Customer: {invoice.customerName} / {invoice.customerCode}
                </p>
                <p className="mt-1 font-body text-sm text-on-surface-variant">
                  Shipment: {invoice.trackingNumber}
                </p>
              </div>
              <div className="grid gap-3 text-sm">
                {[
                  { icon: ReceiptText, label: "Status", value: invoice.status },
                  { icon: CreditCard, label: "Paid", value: money(paidAmount, invoice.currency) },
                  { icon: CreditCard, label: "Balance", value: money(balance, invoice.currency) },
                  { icon: Truck, label: "Created", value: invoice.createdAt },
                ].map((item) => (
                  <div className="flex items-center gap-3" key={item.label}>
                    <item.icon className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                        {item.label}
                      </p>
                      <p className="font-data text-sm font-bold text-on-surface capitalize">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-heading text-2xl font-bold text-primary">Charges</h3>
              <div className="mt-4 divide-y divide-surface-container-high rounded-xl border border-outline-variant">
                {lines.map((line) => (
                  <div className="flex items-center justify-between px-5 py-4" key={line.label}>
                    <div>
                      <p className="font-data text-sm font-bold text-on-surface">
                        {line.label}
                      </p>
                      {line.includedInTotal === false ? (
                        <p className="mt-1 font-data text-xs font-semibold text-on-surface-variant">
                          Excluded from total
                        </p>
                      ) : null}
                    </div>
                    <p className="font-data text-sm font-bold text-primary">
                      {money(Number(line.amount), invoice.currency)}
                    </p>
                  </div>
                ))}
                <div className="flex items-center justify-between bg-surface-container-low px-5 py-5">
                  <p className="font-heading text-xl font-bold text-primary">Total</p>
                  <p className="font-heading text-2xl font-bold text-primary">
                    {money(invoice.totalAmount, invoice.currency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-heading text-2xl font-bold text-primary">Payments</h3>
              <div className="mt-4 divide-y divide-surface-container-high rounded-xl border border-outline-variant">
                {payments.length ? (
                  payments.map((payment) => (
                    <div className="flex items-center justify-between px-5 py-4" key={payment.id}>
                      <div>
                        <p className="font-data text-sm font-bold text-on-surface">
                          {money(payment.amount, payment.currency)}
                        </p>
                        <p className="mt-1 font-body text-sm text-on-surface-variant">
                          {payment.paymentMethod.replaceAll("_", " ")} / {payment.referenceNumber}
                        </p>
                      </div>
                      <p className="font-data text-sm font-semibold text-on-surface">
                        {payment.paymentDate}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="px-5 py-4 font-body text-sm text-on-surface-variant">
                    No payments recorded for this invoice.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
