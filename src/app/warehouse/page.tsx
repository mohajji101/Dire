import {
  Archive,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  Map,
  PackageCheck,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AssignShelfForm } from "@/components/assign-shelf-form";
import { ReceivePackageForm } from "@/components/receive-package-form";
import { ReleasePackageButton } from "@/components/release-package-button";
import {
  listBranches,
  listBuyShipRequests,
  listRecentWarehouseActivity,
  listShipments,
  listWarehousePackages,
  listWarehouses,
  listWarehouseZones,
} from "@/lib/supabase/dire-data";

const packageStatusClasses = {
  pending_verification: "bg-yellow-50 text-yellow-800",
  stored: "bg-blue-50 text-blue-800",
  ready_for_shipment: "bg-emerald-50 text-success",
};

const shelfStatusClasses = {
  available: "border-emerald-200 bg-emerald-50 text-success",
  occupied: "border-blue-200 bg-blue-50 text-blue-800",
  reserved: "border-yellow-200 bg-yellow-50 text-yellow-800",
};

type WarehousePageProps = {
  searchParams?: Promise<{
    search?: string;
    status?: string;
    warehouse?: string;
  }>;
};

export default async function WarehousePage({ searchParams }: WarehousePageProps) {
  const filters = (await searchParams) ?? {};
  const [
    { items: warehousePackages, mode: packagesMode },
    { items: warehouseZones },
    { items: branches },
    { items: buyShipRequests },
    { items: warehouses },
    { items: shipments },
    { items: recentActivity },
  ] = await Promise.all([
    listWarehousePackages({
      search: filters.search,
      status: filters.status,
      warehouse: filters.warehouse,
    }),
    listWarehouseZones(),
    listBranches(),
    listBuyShipRequests({ status: "in_warehouse" }),
    listWarehouses(),
    listShipments(),
    listRecentWarehouseActivity(),
  ]);

  const todayKey = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Africa/Mogadishu",
  }).format(new Date());
  const receivedToday = warehousePackages.filter((item) =>
    item.receivedAt.startsWith(todayKey),
  ).length;
  const pendingVerification = warehousePackages.filter(
    (item) => item.status === "pending_verification",
  ).length;
  const readyForShipment = warehousePackages.filter(
    (item) => item.status === "ready_for_shipment",
  ).length;
  const totalCapacity = warehouseZones.reduce((sum, zone) => sum + zone.capacity, 0);
  const usedCapacity = warehouseZones.reduce((sum, zone) => sum + zone.used, 0);
  const capacityPercent =
    totalCapacity > 0 ? Math.round((usedCapacity / totalCapacity) * 100) : 0;
  const sourceBranches = branches
    .filter((branch) => branch.branchType !== "Warehouse")
    .map((branch) => ({
      id: branch.id,
      label: `${branch.name} (${branch.branchType})`,
    }));
  const receivableShipments = shipments.filter((shipment) =>
    ["pending", "in_warehouse"].includes(shipment.status),
  );

  return (
    <AppShell activeItem="Warehouse">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 md:p-6">
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:flex md:items-center md:justify-between md:p-8">
          <div>
            <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
              Warehouse
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-primary md:text-4xl">
              Warehouse Management
            </h1>
            <p className="mt-3 max-w-3xl font-body text-base text-on-surface-variant md:text-lg">
              Receive packages, verify customer codes, assign shelves, and
              monitor China and Somalia warehouse capacity.
            </p>
          </div>
          <ReceivePackageForm
            branches={sourceBranches}
            shipments={[
              ...receivableShipments.map((shipment) => ({
                customerCode: shipment.customerCode,
                id: shipment.id,
                kind: "shipment" as const,
                label: `${shipment.trackingNumber} - ${shipment.customer}`,
                shipmentType: shipment.shipmentType,
              })),
              ...buyShipRequests.map((request) => ({
                customerCode: request.customerCode,
                id: request.id,
                kind: "buy_ship_request" as const,
                label: `${request.requestNumber} - ${request.productName} (${request.customerName})`,
                shipmentType: "BUY_AND_SHIP" as const,
              })),
            ]}
            triggerClassName="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary transition hover:bg-primary-container md:mt-0"
            warehouses={warehouses}
          />
        </section>

        {sourceBranches.length === 0 || warehouses.length === 0 ? (
          <section className="rounded-xl border border-error/30 bg-red-50 p-4 shadow-sm">
            <p className="font-data text-sm font-bold text-error">
              Warehouse receive flow needs live location records.
            </p>
            <p className="mt-1 font-body text-sm text-red-700">
              Add source branches and receiving warehouses in Settings or run the
              latest Supabase RLS policies if those records already exist.
            </p>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-5">
          {[
            { label: "Received Today", value: receivedToday, icon: PackageCheck },
            { label: "Pending Verification", value: pendingVerification, icon: ClipboardCheck },
            { label: "Stored Packages", value: warehousePackages.length, icon: Archive },
            { label: "Ready", value: readyForShipment, icon: CheckCircle2 },
            { label: "Capacity", value: `${capacityPercent}%`, icon: Boxes },
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
            <div className="flex items-center gap-3 border-b border-outline-variant p-5">
              <Map className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-heading text-2xl font-bold text-primary">
                  Storage Map
                </h2>
                <p className="mt-1 font-body text-sm text-on-surface-variant">
                  {packagesMode === "supabase"
                    ? "Zone to shelf visualization from Supabase."
                    : "Zone to shelf visualization from `/api/v1/warehouse/zones`."}
                </p>
              </div>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-3">
              {warehouseZones.map((zone) => {
                const zonePercent = Math.round((zone.used / zone.capacity) * 100);

                return (
                  <article
                    className="rounded-lg border border-outline-variant bg-surface-container-low p-4"
                    key={zone.id}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-data text-sm font-bold text-on-surface">
                        {zone.name}
                      </h3>
                      <span className="font-data text-xs font-bold text-on-surface-variant">
                        {zonePercent}%
                      </span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-surface-container-high">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${zonePercent}%` }}
                      />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {zone.shelves.map((shelf) => (
                        <div
                          className={`rounded-lg border p-3 text-center font-data text-xs font-bold ${
                            shelfStatusClasses[shelf.status]
                          }`}
                          key={shelf.id}
                        >
                          <p>{shelf.code}</p>
                          <p className="mt-1 capitalize">{shelf.status}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="border-b border-outline-variant p-5">
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="font-heading text-2xl font-bold text-primary">
                    Receiving Queue
                  </h2>
                  <p className="mt-1 font-body text-sm text-on-surface-variant">
                    Packages awaiting verification and shelf assignment.
                  </p>
                </div>
                <form className="grid gap-3" method="get">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <select
                      className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container px-3 font-data text-sm font-bold text-on-surface"
                      defaultValue={filters.status ?? ""}
                      name="status"
                    >
                      <option value="">All Statuses</option>
                      <option value="pending_verification">Pending Verification</option>
                      <option value="stored">Stored</option>
                      <option value="ready_for_shipment">Ready</option>
                    </select>
                    <select
                      className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container px-3 font-data text-sm font-bold text-on-surface"
                      defaultValue={filters.warehouse ?? ""}
                      name="warehouse"
                    >
                      <option value="">All Warehouses</option>
                      {warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.name}>
                          {warehouse.name}
                        </option>
                      ))}
                    </select>
                    <button
                      className="inline-flex h-10 w-full shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-surface-container px-4 font-data text-sm font-bold text-on-surface md:w-auto"
                      type="submit"
                    >
                      Filter
                    </button>
                  </div>

                  <label className="relative min-w-0">
                    <span className="sr-only">Search warehouse packages</span>
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-low px-9 font-data text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      defaultValue={filters.search ?? ""}
                      name="search"
                      placeholder="Package, customer, tracking..."
                    />
                  </label>
                </form>
              </div>
            </div>
            <div className="divide-y divide-surface-container-high">
              {warehousePackages
                .filter((item) => item.status === "pending_verification")
                .map((item) => (
                  <div className="p-5" key={item.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-data text-sm font-bold text-primary">
                          {item.packageCode}
                        </p>
                        <p className="mt-1 font-body text-sm text-on-surface-variant">
                          {item.customerName} / {item.customerCode}
                        </p>
                      </div>
                      <span className="rounded-full bg-yellow-50 px-3 py-1 font-data text-xs font-bold text-yellow-800">
                        Verify
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 font-data text-xs text-on-surface-variant">
                      <p>Weight: {item.weight}</p>
                      <p>Warehouse: {item.warehouse}</p>
                      <p>Shelf: {item.shelf}</p>
                      <p>By: {item.receivedBy}</p>
                    </div>
                    <AssignShelfForm
                      packageId={item.id}
                      shelves={warehouseZones
                        .filter((zone) => zone.warehouseId === item.warehouseId)
                        .flatMap((zone) =>
                          zone.shelves
                            .filter((shelf) => shelf.status === "available")
                            .map((shelf) => ({
                              id: shelf.id,
                              label: `${zone.name} / ${shelf.code}`,
                            })),
                        )}
                    />
                  </div>
                ))}
            </div>
          </aside>
        </section>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant p-5">
            <h2 className="font-heading text-2xl font-bold text-primary">
              Recent Warehouse Activity
            </h2>
            <p className="mt-1 font-body text-sm text-on-surface-variant">
              Latest receive, shelf, and release events from warehouse operations.
            </p>
          </div>
          <div className="divide-y divide-surface-container-high">
            {recentActivity.length ? (
              recentActivity.map((activity) => (
                <div
                  className="flex flex-col gap-2 p-5 md:flex-row md:items-start md:justify-between"
                  key={activity.id}
                >
                  <div>
                    <p className="font-data text-sm font-bold text-primary">
                      {activity.trackingNumber}
                    </p>
                    <p className="mt-1 font-body text-sm text-on-surface-variant">
                      {activity.note}
                    </p>
                    <p className="mt-2 font-data text-xs font-semibold text-on-surface-variant">
                      {activity.status}
                    </p>
                  </div>
                  <p className="font-data text-sm text-on-surface">
                    {activity.createdAt}
                  </p>
                </div>
              ))
            ) : (
              <p className="p-5 font-body text-sm text-on-surface-variant">
                No warehouse activity recorded yet.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant p-5">
            <h2 className="font-heading text-2xl font-bold text-primary">
              Package Inventory
            </h2>
            <p className="mt-1 font-body text-sm text-on-surface-variant">
              {packagesMode === "supabase"
                ? "Live warehouse package inventory from Supabase."
                : "API-ready demo data from `/api/v1/warehouse/packages`."}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  {[
                    "Package",
                    "Customer",
                    "Shipment",
                    "Warehouse",
                    "Zone / Shelf",
                    "Weight",
                    "Received",
                    "Status",
                    "Action",
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
                {warehousePackages.map((item) => (
                  <tr
                    className="border-b border-surface-container-high transition hover:bg-surface-container-low"
                    key={item.id}
                  >
                    <td className="px-5 py-4 font-data text-sm font-bold text-primary">
                      {item.packageCode}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-data text-sm font-bold text-on-surface">
                        {item.customerName}
                      </p>
                      <p className="mt-1 font-data text-xs text-on-surface-variant">
                        {item.customerCode}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-data text-sm font-semibold text-on-surface">
                      {item.trackingNumber}
                    </td>
                    <td className="px-5 py-4 font-data text-sm text-on-surface">
                      {item.warehouse}
                    </td>
                    <td className="px-5 py-4 font-data text-sm text-on-surface">
                      {item.zone} / {item.shelf}
                    </td>
                    <td className="px-5 py-4 font-data text-sm text-on-surface">
                      {item.weight}
                    </td>
                    <td className="px-5 py-4 font-data text-sm text-on-surface">
                      {item.receivedAt}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 font-data text-xs font-bold capitalize ${
                          packageStatusClasses[item.status]
                        }`}
                      >
                        {item.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {item.status === "stored" ? (
                        <ReleasePackageButton
                          packageCode={item.packageCode}
                          packageId={item.id}
                          warehouseName={item.warehouse}
                        />
                      ) : (
                        <span className="font-data text-xs text-on-surface-variant">-</span>
                      )}
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
