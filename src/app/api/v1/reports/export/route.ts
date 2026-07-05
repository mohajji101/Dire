import { requireApiRole } from "@/lib/api-auth";
import { getReportsSummary } from "@/lib/supabase/dire-data";

function csvEscape(value: string | number) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  const auth = await requireApiRole([
    "super_admin",
    "operations",
    "finance",
    "support",
    "warehouse",
  ]);
  if (!auth.ok) return auth.response;

  const reports = await getReportsSummary();
  const lines = [
    ["section", "label", "value"],
    ["summary", "customers_total", reports.customers.total],
    ["summary", "customers_active", reports.customers.active],
    ["summary", "shipments_total", reports.shipments.total],
    ["summary", "warehouse_packages", reports.warehouse.packages],
    ["summary", "warehouse_pending_verification", reports.warehouse.pendingVerification],
    ["summary", "warehouse_stored", reports.warehouse.stored],
    ["summary", "revenue_total", reports.revenue.revenue],
    ["summary", "expenses_total", reports.revenue.expenses],
    ["summary", "profit_estimate", reports.revenue.profit],
    ["summary", "support_open", reports.support.open],
    ["summary", "support_urgent", reports.support.urgent],
    ...reports.shipments.topRoutes.map((route) => ["route", route.route, route.count]),
    ...reports.customers.topCustomers.map((customer) => [
      "customer",
      `${customer.customerCode} ${customer.name}`,
      customer.shipments,
    ]),
    ...reports.finance.topCustomersByRevenue.map((customer) => [
      "customer_revenue",
      `${customer.customerCode} ${customer.customer}`,
      customer.revenue,
    ]),
    ...reports.finance.overdueInvoices.map((invoice) => [
      "overdue_invoice",
      `${invoice.invoiceNumber} ${invoice.customer}`,
      invoice.amount,
    ]),
    ...reports.warehouse.capacity.map((zone) => [
      "warehouse_zone",
      zone.zone,
      `${zone.used}/${zone.capacity} (${zone.utilization}%)`,
    ]),
    ...reports.warehouse.byWarehouse.map((warehouse) => [
      "warehouse",
      warehouse.name,
      `packages=${warehouse.packages}; pending=${warehouse.pendingVerification}; stored=${warehouse.stored}; ready=${warehouse.readyForShipment}`,
    ]),
  ];

  const csv = lines
    .map((line) => line.map((value) => csvEscape(value)).join(","))
    .join("\n");

  return new Response(csv, {
    headers: {
      "Content-Disposition": 'attachment; filename="dire-reports-export.csv"',
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
