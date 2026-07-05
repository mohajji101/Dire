import {
  AlertTriangle,
  Boxes,
  CircleHelp,
  Download,
  ReceiptText,
  Ship,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { PageContentSkeleton } from "@/components/page-content-skeleton";
import { getReportsSummary } from "@/lib/supabase/dire-data";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

async function ReportsPageContent() {
  const reports = await getReportsSummary();
  const maxMonthlyValue = Math.max(
    ...reports.revenue.monthlyRevenue.flatMap((item) => [item.revenue, item.expenses]),
    1,
  );
  const airShipments = reports.shipments.byType.AIR ?? 0;
  const buyShipments = reports.shipments.byType.BUY_AND_SHIP ?? 0;
  const seaShipments = reports.shipments.byType.SEA ?? 0;
  const warehouseUtilization =
    reports.warehouse.capacity.length > 0
      ? Math.round(
          (reports.warehouse.capacity.reduce((sum, zone) => sum + zone.used, 0) /
            Math.max(
              reports.warehouse.capacity.reduce((sum, zone) => sum + zone.capacity, 0),
              1,
            )) *
            100,
        )
      : 0;

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 md:p-6">
      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:flex md:items-center md:justify-between md:p-8">
        <div>
          <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
            Reports
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-primary md:text-4xl">
            Reports & Analytics
          </h1>
          <p className="mt-3 max-w-3xl font-body text-base text-on-surface-variant md:text-lg">
            Analyze revenue, shipment performance, customer activity,
            warehouse efficiency, and air vs sea trends.
          </p>
        </div>
        <Link
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-data text-sm font-bold text-on-primary transition hover:bg-primary-container md:mt-0"
          href="/api/v1/reports/export"
        >
          <Download className="h-4 w-4" />
          Export Report
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { href: "/shipments", label: "Shipments", value: reports.shipments.total, icon: Ship },
          { href: "/customers", label: "Customers", value: reports.customers.total, icon: Users },
          { href: "/warehouse", label: "Warehouse Utilization", value: `${warehouseUtilization}%`, icon: Boxes },
          {
            href: "/invoices?status=overdue",
            label: "Overdue Invoices",
            value: reports.finance.overdueInvoices.length,
            icon: ReceiptText,
          },
        ].map((stat) => (
          <Link
            className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-sm transition hover:bg-surface-container-low"
            href={stat.href}
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
          </Link>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant p-5">
            <h2 className="font-heading text-2xl font-bold text-primary">
              Monthly Revenue vs Expenses
            </h2>
            <p className="mt-1 font-body text-sm text-on-surface-variant">
              {reports.mode === "supabase"
                ? "Live summary backed by Supabase records in USD equivalent."
                : "Demo feed from `/api/v1/reports/revenue`."}
            </p>
          </div>
          <div className="space-y-4 p-5">
            <div className="grid gap-3 md:grid-cols-[56px_1fr_1fr_96px_96px]">
              <div />
              <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                Revenue
              </p>
              <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                Expenses
              </p>
              <div />
              <div />
            </div>
            {reports.revenue.monthlyRevenue.map((item) => (
              <div className="grid gap-3 md:grid-cols-[56px_1fr_1fr_96px_96px]" key={item.month}>
                <p className="font-data text-sm font-bold text-on-surface">
                  {item.month}
                </p>
                <div className="h-4 rounded-full bg-surface-container-high">
                  <div
                    className="h-4 rounded-full bg-primary"
                    style={{ width: `${(item.revenue / maxMonthlyValue) * 100}%` }}
                  />
                </div>
                <div className="h-4 rounded-full bg-surface-container-high">
                  <div
                    className="h-4 rounded-full bg-secondary-container"
                    style={{ width: `${(item.expenses / maxMonthlyValue) * 100}%` }}
                  />
                </div>
                <p className="font-data text-sm font-bold text-on-surface">
                  {money(item.revenue)} USD Eq.
                </p>
                <p className="font-data text-sm font-bold text-on-surface-variant">
                  {money(item.expenses)} USD Eq.
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside className="grid gap-6">
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
            <h2 className="font-heading text-2xl font-bold text-primary">
              Air vs Sea
            </h2>
            <div className="mt-5 space-y-4">
              {[
                { label: "Air", value: airShipments },
                { label: "Sea", value: seaShipments },
                { label: "Buy & Ship", value: buyShipments },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between font-data text-sm font-bold text-on-surface">
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-surface-container-high">
                    <div
                      className="h-3 rounded-full bg-secondary-container"
                      style={{
                        width: `${(item.value / Math.max(reports.shipments.total, 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
            <h2 className="font-heading text-2xl font-bold text-primary">
              Warehouse Efficiency
            </h2>
            <div className="mt-5 space-y-4">
              {reports.warehouse.capacity.map((zone) => (
                <div key={zone.zone}>
                  <div className="flex justify-between font-data text-sm font-bold text-on-surface">
                    <span>{zone.zone}</span>
                    <span>{zone.utilization}%</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-surface-container-high">
                    <div
                      className="h-3 rounded-full bg-primary"
                      style={{ width: `${zone.utilization}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant p-5">
            <h2 className="font-heading text-2xl font-bold text-primary">
              Top Customers by Revenue
            </h2>
            <p className="mt-1 font-body text-sm text-on-surface-variant">
              Revenue totals are shown in USD equivalent.
            </p>
          </div>
          <div className="divide-y divide-surface-container-high">
            {reports.finance.topCustomersByRevenue.map((customer) => (
              <div className="flex items-center justify-between p-5" key={customer.customerCode}>
                <div>
                  <p className="font-data text-sm font-bold text-primary">
                    {customer.customer}
                  </p>
                  <p className="mt-1 font-data text-xs text-on-surface-variant">
                    {customer.customerCode}
                  </p>
                </div>
                <p className="font-heading text-2xl font-bold text-primary">
                  {money(customer.revenue)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="border-b border-outline-variant p-5">
            <h2 className="font-heading text-2xl font-bold text-primary">
              Operational Risks
            </h2>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-3">
            {[
              {
                icon: AlertTriangle,
                label: "Overdue Invoices",
                value: reports.finance.overdueInvoices.length,
              },
              {
                icon: CircleHelp,
                label: "Open Tickets",
                value: reports.support.open,
              },
              {
                icon: Boxes,
                label: "Pending Verification",
                value: reports.warehouse.pendingVerification,
              },
            ].map((item) => (
              <article
                className="rounded-lg border border-outline-variant bg-surface-container-low p-4"
                key={item.label}
              >
                <item.icon className="h-5 w-5 text-primary" />
                <p className="mt-3 font-data text-xs font-semibold uppercase text-on-surface-variant">
                  {item.label}
                </p>
                <p className="mt-2 font-heading text-3xl font-bold text-primary">
                  {item.value}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <AppShell activeItem="Reports">
      <Suspense fallback={<PageContentSkeleton />}>
        <ReportsPageContent />
      </Suspense>
    </AppShell>
  );
}
