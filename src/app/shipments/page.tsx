import Link from "next/link";
import { Plus, Search, Truck } from "lucide-react";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { PageContentSkeleton } from "@/components/page-content-skeleton";
import { type ShipmentStatus } from "@/lib/demo-data";
import { shipmentStatusLabels, shipmentStatusOptions } from "@/lib/shipment-status";
import { getCurrentAppUser, listShipments } from "@/lib/supabase/dire-data";

const statusClasses: Record<ShipmentStatus, string> = {
  pending: "bg-yellow-50 text-yellow-800",
  in_transit: "bg-blue-50 text-blue-800",
  customs_clearance: "bg-red-50 text-error",
  in_warehouse: "bg-surface-container-high text-on-surface-variant",
  ready_for_pickup: "bg-emerald-50 text-success",
  delivered: "bg-emerald-50 text-success",
};

type ShipmentsPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    type?: string;
  }>;
};

async function ShipmentsPageContent({ searchParams }: ShipmentsPageProps) {
  const filters = await searchParams;
  const [user, shipmentResult] = await Promise.all([
    getCurrentAppUser(),
    listShipments({
      search: filters.search,
      status: filters.status,
      type: filters.type,
    }),
  ]);
  const { items: shipments, mode } = shipmentResult;

  const activeCount = shipments.filter(
    (shipment) => shipment.status !== "delivered",
  ).length;
  const customsCount = shipments.filter(
    (shipment) => shipment.status === "customs_clearance",
  ).length;
  const warehouseCount = shipments.filter(
    (shipment) => shipment.status === "in_warehouse",
  ).length;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 md:p-6">
      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:flex md:items-center md:justify-between md:p-8">
        <div>
          <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
            Shipments
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-primary md:text-4xl">
            Shipment Management
          </h1>
          <p className="mt-3 max-w-3xl font-body text-base text-on-surface-variant md:text-lg">
            Filter, inspect, and update air, sea, and Buy & Ship cargo
            records across the logistics lifecycle.
          </p>
        </div>
        {user.role !== "customer" ? (
          <Link
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary transition hover:bg-primary-container md:mt-0"
            href="/shipments/new"
          >
            <Plus className="h-4 w-4" />
            Create Shipment
          </Link>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Active", value: activeCount },
          { label: "Customs Queue", value: customsCount },
          { label: "China Warehouse", value: warehouseCount },
          { label: "Total Records", value: shipments.length },
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
              Shipment List
            </h2>
            <p className="mt-1 font-body text-sm text-on-surface-variant">
              {mode === "supabase"
                ? "Live shipment records from Supabase."
                : "API-ready demo data from `/api/v1/shipments`."}
            </p>
          </div>
          <form className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_auto_auto_auto]" method="get">
            <label className="relative">
              <span className="sr-only">Search shipments</span>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-low px-9 font-data text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                defaultValue={filters.search ?? ""}
                name="search"
                placeholder="Tracking, customer, route..."
              />
            </label>
            <select
              className="h-10 rounded-lg border border-outline-variant bg-surface-container px-3 font-data text-sm font-bold text-on-surface"
              defaultValue={filters.status ?? ""}
              name="status"
            >
              <option value="">All Statuses</option>
              {shipmentStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-lg border border-outline-variant bg-surface-container px-3 font-data text-sm font-bold text-on-surface"
              defaultValue={filters.type ?? ""}
              name="type"
            >
              <option value="">All Types</option>
              <option value="AIR">AIR</option>
              <option value="SEA">SEA</option>
              <option value="BUY_AND_SHIP">BUY_AND_SHIP</option>
            </select>
            <button
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary transition hover:bg-primary-container"
              type="submit"
            >
              Filter
            </button>
          </form>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-surface-container-high">
            <thead className="bg-surface-container-low">
              <tr>
                {[
                  "Tracking",
                  "Customer",
                  "Cargo",
                  "Route",
                  "Type",
                  "Status",
                  "Weight",
                  "Invoice",
                ].map((heading) => (
                  <th
                    className="px-5 py-4 text-left font-data text-xs font-bold uppercase tracking-wide text-on-surface-variant"
                    key={heading}
                    scope="col"
                  >
                    {heading}
                  </th>
                ))}
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high bg-surface-container-lowest">
              {shipments.map((shipment) => (
                <tr key={shipment.id}>
                  <td className="px-5 py-4">
                    <p className="font-data text-sm font-bold text-primary">
                      {shipment.trackingNumber}
                    </p>
                    <p className="mt-1 font-data text-xs text-on-surface-variant">
                      {shipment.location}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-data text-sm font-bold text-on-surface">
                      {shipment.customer}
                    </p>
                    <p className="mt-1 font-data text-xs text-on-surface-variant">
                      {shipment.customerCode}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-data text-sm font-bold text-on-surface">
                      {shipment.commodity || "General cargo"}
                    </p>
                    <p className="mt-1 font-data text-xs text-on-surface-variant">
                      {shipment.packageCount ?? 1} package(s)
                    </p>
                  </td>
                  <td className="px-5 py-4 font-body text-sm text-on-surface-variant">
                    {shipment.origin} to {shipment.destination}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-surface-container-high px-3 py-1 font-data text-xs font-bold text-on-surface-variant">
                      {shipment.shipmentType.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 font-data text-xs font-bold ${statusClasses[shipment.status]}`}
                    >
                      {shipmentStatusLabels[shipment.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-body text-sm text-on-surface-variant">
                    {shipment.shipmentType === "SEA"
                      ? `${shipment.weight} / ${shipment.cbm} CBM`
                      : shipment.weight}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={
                        shipment.invoiceStatus === "paid"
                          ? "rounded-full bg-emerald-50 px-3 py-1 font-data text-xs font-bold text-success"
                          : shipment.invoiceStatus === "overdue"
                            ? "rounded-full bg-red-50 px-3 py-1 font-data text-xs font-bold text-error"
                            : "rounded-full bg-yellow-50 px-3 py-1 font-data text-xs font-bold text-yellow-800"
                      }
                    >
                      {shipment.invoiceStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-3 py-2 font-data text-sm font-bold text-primary transition hover:bg-surface-container-low"
                      href={`/shipments/${shipment.id}`}
                    >
                      <Truck className="h-4 w-4" />
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function ShipmentsPage(props: ShipmentsPageProps) {
  return (
    <AppShell activeItem="Shipments">
      <Suspense fallback={<PageContentSkeleton sidePanels={false} />}>
        <ShipmentsPageContent {...props} />
      </Suspense>
    </AppShell>
  );
}
