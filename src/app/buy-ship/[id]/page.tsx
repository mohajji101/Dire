import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  PackageCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BuyShipManagementForm } from "@/components/buy-ship-management-form";
import { getBuyShipDetail, listCurrencies } from "@/lib/supabase/dire-data";

type BuyShipDetailPageProps = {
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

export default async function BuyShipDetailPage({
  params,
}: BuyShipDetailPageProps) {
  const { id } = await params;
  const [detail, { items: currencies }] = await Promise.all([
    getBuyShipDetail(id),
    listCurrencies(),
  ]);

  if (!detail) {
    return (
      <AppShell activeItem="Buy & Ship">
        <div className="p-6">
          <p className="font-data text-sm font-bold text-error">
            Buy & Ship request not found.
          </p>
        </div>
      </AppShell>
    );
  }

  const { request, statusFlow } = detail;

  return (
    <AppShell activeItem="Buy & Ship">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 p-4 md:p-6">
        <Link
          className="inline-flex w-fit items-center gap-2 font-data text-sm font-bold text-primary hover:underline"
          href="/buy-ship"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Buy & Ship
        </Link>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:flex md:items-center md:justify-between md:p-8">
          <div>
            <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
              {request.requestNumber}
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-primary md:text-4xl">
              {request.productName}
            </h1>
            <p className="mt-3 font-body text-base text-on-surface-variant">
              {request.customerName} / {request.customerCode}
            </p>
          </div>
          <a
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary md:mt-0"
            href={request.purchaseLink}
          >
            Supplier Link
            <ExternalLink className="h-4 w-4" />
          </a>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="border-b border-outline-variant p-5">
              <h2 className="font-heading text-2xl font-bold text-primary">
                Status Flow
              </h2>
              <p className="mt-1 font-body text-sm text-on-surface-variant">
                Purchase lifecycle from request to shipment conversion.
              </p>
            </div>
            <div className="p-5">
              {statusFlow.map(({ complete, status }, index) => {
                return (
                  <div className="relative flex gap-4 pb-8 last:pb-0" key={status}>
                    <div className="flex flex-col items-center">
                      <span
                        className={
                          complete
                            ? "flex h-6 w-6 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container"
                            : "h-6 w-6 rounded-full bg-surface-container-high"
                        }
                      >
                        {complete ? <CheckCircle2 className="h-4 w-4" /> : null}
                      </span>
                      {index < statusFlow.length - 1 ? (
                        <span className="mt-2 h-full w-0.5 bg-outline-variant" />
                      ) : null}
                    </div>
                    <div>
                      <p className="font-data text-sm font-bold capitalize text-on-surface">
                        {status.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 font-body text-sm text-on-surface-variant">
                        {complete
                          ? "Step completed or currently active."
                          : "Waiting for the previous step."}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="grid gap-4">
            {[
              {
                icon: ShoppingCart,
                label: "Supplier",
                value: request.supplier,
              },
              {
                icon: CreditCard,
                label: "Payment",
                value: request.paymentStatus.replaceAll("_", " "),
              },
              {
                icon: PackageCheck,
                label: "Pricing",
                value: request.pricingBasis.replaceAll("_", " "),
              },
              {
                icon: CreditCard,
                label: "Estimate",
                value: money(request.estimatedPrice + request.serviceFee, request.currency),
              },
              {
                icon: Truck,
                label: "Shipment",
                value: request.trackingNumber ?? "Not converted",
              },
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

            {request.shipmentId ? (
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary"
                href={`/shipments/${request.shipmentId}`}
              >
                Open Shipment
                <Truck className="h-4 w-4" />
              </Link>
            ) : null}

            <BuyShipManagementForm
              currencies={currencies.map((currency) => ({
                code: currency.code,
                label: `${currency.code} - ${currency.name}`,
              }))}
              request={{
                currency: request.currency,
                estimatedPrice: request.estimatedPrice,
                id: request.id,
                pricingBasis: request.pricingBasis,
                productName: request.productName,
                purchaseLink: request.purchaseLink,
                quantity: request.quantity,
                status: request.status,
                unitPrice: request.unitPrice,
              }}
            />
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
