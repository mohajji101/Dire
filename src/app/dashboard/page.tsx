import { Activity, ArrowRight, CircleAlert, Package, ReceiptText, Users } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { PageContentSkeleton } from "@/components/page-content-skeleton";
import { getCurrentAppUser, getDashboardOverviewData } from "@/lib/supabase/dire-data";

const statIcons = {
  "Active Shipments": Activity,
  "Pending Invoices": ReceiptText,
  Revenue: CircleAlert,
  "Total Customers": Users,
};

async function DashboardPageContent() {
  const [overview, currentUser] = await Promise.all([
    getDashboardOverviewData(),
    getCurrentAppUser(),
  ]);
  const roleLabel = currentUser.role.replaceAll("_", " ");
  const dashboardTitle =
    currentUser.role === "super_admin"
      ? "Super Admin Dashboard"
      : `${roleLabel[0]?.toUpperCase() ?? ""}${roleLabel.slice(1)} Dashboard`;
  const maxStatus = Math.max(...overview.statusBreakdown.map((item) => item.value), 1);
  const statLinks: Record<string, string> = {
    "Active Shipments": "/shipments",
    "Pending Invoices": "/invoices?status=pending",
    Revenue: "/finance",
    "Total Customers": "/customers",
  };

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 md:p-6">
      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:flex md:items-center md:justify-between md:p-8">
        <div>
          <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
            Dashboard
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-primary md:text-4xl">
            {dashboardTitle}
          </h1>
          <p className="mt-3 max-w-3xl font-body text-base text-on-surface-variant md:text-lg">
            Global control view for customers, shipments, finance, warehouse,
            and support operations.
          </p>
        </div>
        <div className="mt-6 rounded-xl border border-outline-variant bg-surface-container p-4 md:mt-0 md:min-w-[280px]">
          <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
            Signed in
          </p>
          <p className="mt-2 font-data text-base font-bold text-on-surface">
            {currentUser.email}
          </p>
          <p className="mt-1 font-body text-sm text-on-surface-variant">
            Role: {currentUser.role.replaceAll("_", " ")}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {overview.stats.map((stat) => {
          const Icon = statIcons[stat.label as keyof typeof statIcons] ?? Package;

          return (
            <Link
              className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-sm transition hover:bg-surface-container-low"
              href={statLinks[stat.label] ?? "/dashboard"}
              key={stat.label}
            >
              <div className="flex items-center justify-between">
                <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                  {stat.label}
                </p>
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-3 font-heading text-3xl font-bold text-primary">
                {stat.value}
              </p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant p-5">
            <h2 className="font-heading text-2xl font-bold text-primary">
              Operational Snapshot
            </h2>
            <p className="mt-1 font-body text-sm text-on-surface-variant">
              {overview.mode === "supabase"
                ? "Live overview backed by Supabase."
                : "Demo overview is showing because live Supabase data is not available."}
            </p>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            {[
              { label: "Active Customers", value: overview.summary.activeCustomers },
              { label: "Active Shipments", value: overview.summary.activeShipments },
              { label: "Monthly Revenue", value: overview.summary.monthlyRevenue },
              {
                label: "Warehouse Utilization",
                value: `${overview.summary.warehouseUtilization}%`,
              },
            ].map((item) => (
              <Link
                className="rounded-lg border border-outline-variant bg-surface-container-low p-4 transition hover:bg-surface-container"
                href={
                  item.label === "Active Customers"
                    ? "/customers"
                    : item.label === "Active Shipments"
                      ? "/shipments"
                      : item.label === "Monthly Revenue"
                        ? "/finance"
                        : "/warehouse"
                }
                key={item.label}
              >
                <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                  {item.label}
                </p>
                <p className="mt-3 font-heading text-2xl font-bold text-primary">
                  {item.value}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <aside className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant p-5">
            <h2 className="font-heading text-2xl font-bold text-primary">
              Action Queue
            </h2>
          </div>
          <div className="space-y-4 p-5">
            {overview.alerts.map((alert) => (
              <Link
                className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low p-4 transition hover:border-primary/40 hover:bg-surface-container"
                href={alert.href}
                key={alert.label}
              >
                <div>
                  <p className="font-data text-sm font-bold text-on-surface">
                    {alert.label}
                  </p>
                  <p className="mt-1 font-body text-sm text-on-surface-variant">
                    Monitor and follow up from the related module.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-heading text-2xl font-bold text-primary">
                    {alert.value}
                  </span>
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant p-5">
            <h2 className="font-heading text-2xl font-bold text-primary">
              Shipment Status Mix
            </h2>
          </div>
          <div className="space-y-4 p-5">
            {overview.statusBreakdown.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between font-data text-sm font-bold text-on-surface">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="mt-2 h-3 rounded-full bg-surface-container-high">
                  <div
                    className="h-3 rounded-full bg-primary"
                    style={{ width: `${(item.value / maxStatus) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="border-b border-outline-variant p-5">
              <h2 className="font-heading text-2xl font-bold text-primary">
                Top Customers
              </h2>
            </div>
            <div className="divide-y divide-surface-container-high">
              {overview.customerLeaders.map((customer) => (
                <div className="p-5" key={customer.customerCode}>
                  <p className="font-data text-sm font-bold text-on-surface">
                    {customer.name}
                  </p>
                  <p className="mt-1 font-data text-xs text-on-surface-variant">
                    {customer.customerCode}
                  </p>
                  <div className="mt-3 flex items-center justify-between font-body text-sm text-on-surface-variant">
                    <span>{customer.shipments} shipments</span>
                    <span>{customer.outstandingBalance}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="border-b border-outline-variant p-5">
              <h2 className="font-heading text-2xl font-bold text-primary">
                Top Routes
              </h2>
            </div>
            <div className="divide-y divide-surface-container-high">
              {overview.routeLeaders.map((route) => (
                <div className="p-5" key={route.route}>
                  <p className="font-data text-sm font-bold text-on-surface">
                    {route.route}
                  </p>
                  <p className="mt-2 font-body text-sm text-on-surface-variant">
                    {route.count} shipments
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppShell activeItem="Dashboard">
      <Suspense fallback={<PageContentSkeleton />}>
        <DashboardPageContent />
      </Suspense>
    </AppShell>
  );
}
