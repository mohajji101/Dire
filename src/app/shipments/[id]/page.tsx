import Link from "next/link";
import { ArrowLeft, FileText, MapPin, Package, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ShipmentStatusForm } from "@/components/shipment-status-form";
import { getCurrentAppUser, getShipmentDetail } from "@/lib/supabase/dire-data";

type ShipmentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ShipmentDetailPage({
  params,
}: ShipmentDetailPageProps) {
  const { id } = await params;
  const [detail, currentUser] = await Promise.all([
    getShipmentDetail(id),
    getCurrentAppUser(),
  ]);

  if (!detail) {
    return (
      <AppShell activeItem="Shipments">
        <div className="p-6">
          <p className="font-data text-sm font-bold text-error">
            Shipment not found.
          </p>
        </div>
      </AppShell>
    );
  }

  const { invoiceSummary, shipment, timeline } = detail;

  return (
    <AppShell activeItem="Shipments">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 md:p-6">
        <Link
          className="inline-flex w-fit items-center gap-2 font-data text-sm font-bold text-primary hover:underline"
          href="/shipments"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to shipments
        </Link>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
            {shipment.shipmentType} Shipment
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-primary md:text-4xl">
            {shipment.trackingNumber}
          </h1>
          <p className="mt-3 font-body text-base text-on-surface-variant">
            {shipment.origin} to {shipment.destination}
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="border-b border-outline-variant p-5">
              <h2 className="font-heading text-2xl font-bold text-primary">
                Tracking Timeline
              </h2>
            </div>
            <div className="p-5">
              {timeline.map((event, index) => (
                <div
                  className="relative flex gap-4 pb-8 last:pb-0"
                  key={`${event.date}-${event.status}-${index}`}
                >
                  <div className="flex flex-col items-center">
                    <span className="h-4 w-4 rounded-full bg-secondary-container ring-4 ring-yellow-100" />
                    {index < timeline.length - 1 ? (
                      <span className="mt-2 h-full w-0.5 bg-outline-variant" />
                    ) : null}
                  </div>
                  <div>
                    <p className="font-data text-sm font-bold text-on-surface">
                      {event.status}
                    </p>
                    <p className="mt-1 font-body text-sm text-on-surface-variant">
                      {event.notes}
                    </p>
                    <p className="mt-2 font-data text-xs font-semibold text-on-surface-variant">
                      {event.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="grid gap-4">
            {invoiceSummary?.hasInvoice && invoiceSummary.balanceDue > 0 ? (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
                <p className="font-data text-xs font-semibold uppercase text-yellow-800">
                  Completion Gate
                </p>
                <p className="mt-2 font-data text-sm font-bold text-yellow-900">
                  Final handoff is blocked until payment is completed.
                </p>
                <p className="mt-2 font-body text-sm text-yellow-800">
                  {invoiceSummary.invoiceNumber ?? "Linked invoice"} still has{" "}
                  {new Intl.NumberFormat("en-US", {
                    currency: invoiceSummary.currency,
                    maximumFractionDigits: 2,
                    style: "currency",
                  }).format(invoiceSummary.balanceDue)}{" "}
                  remaining.
                </p>
                {invoiceSummary.invoiceId ? (
                  <Link
                    className="mt-3 inline-flex text-sm font-bold text-primary hover:underline"
                    href={`/invoices/${invoiceSummary.invoiceId}`}
                  >
                    Open invoice
                  </Link>
                ) : null}
              </div>
            ) : null}
            {[
              {
                icon: UserRound,
                label: "Customer",
                value: `${shipment.customer} (${shipment.customerCode})`,
              },
              {
                icon: Package,
                label: "Cargo",
                value: shipment.commodity || "General cargo",
              },
              {
                icon: Package,
                label: "Measurement",
                value:
                  shipment.shipmentType === "SEA"
                    ? `${shipment.weight} / ${shipment.cbm} CBM`
                    : shipment.weight,
              },
              {
                icon: MapPin,
                label: "Current Location",
                value: shipment.location,
              },
              {
                icon: FileText,
                label: "Invoice",
                value: shipment.invoiceStatus,
              },
            ].map((item) => (
              <div
                className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
                key={item.label}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-container-high text-primary">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                      {item.label}
                    </p>
                    <p className="mt-1 font-data text-sm font-bold text-on-surface">
                      {item.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {["super_admin", "operations"].includes(currentUser.role) ? (
              <ShipmentStatusForm
                completionPolicy={
                  invoiceSummary
                    ? {
                        balanceDue: invoiceSummary.balanceDue,
                        currency: invoiceSummary.currency,
                        hasInvoice: invoiceSummary.hasInvoice,
                        invoiceNumber: invoiceSummary.invoiceNumber,
                        paymentStatus: invoiceSummary.paymentStatus,
                      }
                    : undefined
                }
                currentStatus={shipment.status}
                shipmentId={shipment.id}
              />
            ) : null}
          </aside>
        </section>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant p-5">
            <h2 className="font-heading text-2xl font-bold text-primary">
              Cargo Notes
            </h2>
          </div>
          <div className="grid gap-5 p-5 md:grid-cols-2">
            <div>
              <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                Commodity
              </p>
              <p className="mt-2 font-data text-sm font-bold text-on-surface">
                {shipment.commodity || "General cargo"}
              </p>
            </div>
            <div>
              <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                Package Count
              </p>
              <p className="mt-2 font-data text-sm font-bold text-on-surface">
                {shipment.packageCount ?? detail.packages.length} package(s)
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                Description
              </p>
              <p className="mt-2 font-body text-sm text-on-surface">
                {shipment.description || "No extra cargo description was recorded for this shipment."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
