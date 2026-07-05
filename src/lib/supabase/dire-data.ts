import {
  buyShipRequests,
  buyShipStatusFlow,
  branchConfigs,
  currencyConfigs,
  demoCustomers,
  demoExpenses,
  demoInvoices,
  demoPayments,
  demoShipments,
  monthlyRevenue,
  notificationRules,
  shipmentTimeline,
  supportTickets,
  ticketMessages,
  type BuyShipRequest,
  type BranchConfig,
  type CurrencyConfig,
  type DemoCustomer,
  type DemoExpense,
  type DemoInvoice,
  type DemoPayment,
  type DemoShipment,
  type SupportTicket,
  type SystemRole,
  type TicketMessage,
  type WarehousePackage,
  type WarehouseZone,
  warehousePackages,
  warehouseZones,
  systemRoles,
} from "@/lib/demo-data";
import {
  formatShipmentTimelineStatus,
  getShipmentLocationLabel,
} from "@/lib/shipment-status";
import {
  getCustomerDocumentLabel,
  normalizeCustomerType,
} from "@/lib/customer-types";
import { isShipmentCompleted } from "@/lib/workflow-guards";
import type { ChargeType } from "@/lib/shipment-pricing";
import { cache } from "react";
import { hasSupabaseEnv, hasSupabaseServiceRole } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { getShipmentInvoiceSummary } from "@/lib/supabase/invoice-balance";
import { createClient } from "@/lib/supabase/server";

type AppUserProfile = {
  customerId?: string;
  email: string;
  id?: string;
  initials: string;
  mode: "demo" | "supabase";
  name: string;
  profileAddress?: string;
  profileCity?: string;
  profileCountry?: string;
  profilePhone?: string;
  role: string;
};

type CustomerListItem = DemoCustomer & {
  portalLinked: boolean;
  shipmentCount: number;
};

type CurrentCustomerProfileData = {
  customer: DemoCustomer & {
    companyName: string;
    firstName: string;
    lastName: string;
  };
  mode: "demo" | "supabase";
};

type CustomerDetailData = {
  customer: DemoCustomer;
  documents: Array<{
    status: string;
    type: string;
  }>;
  financialSummary: {
    invoiceCount: number;
    outstandingBalance: string;
  };
  mergeHistory: Array<{
    createdAt: string;
    id: string;
    summary: string;
    userEmail: string;
  }>;
  mode: "demo" | "supabase";
  shipments: DemoShipment[];
};

type ShipmentDetailData = {
  invoiceSummary?: {
    balanceDue: number;
    currency: string;
    hasInvoice: boolean;
    invoiceId: string | null;
    invoiceNumber: string | null;
    paymentStatus: "paid" | "pending" | "unbilled";
  };
  mode: "demo" | "supabase";
  packages: Array<{
    cbm: string;
    packageCode: string;
    shelf: string | null;
    weight: string;
  }>;
  shipment: DemoShipment;
  timeline: typeof shipmentTimeline;
};

type InvoiceDetailData = {
  invoice: DemoInvoice;
  lines: Array<{
    amount: number;
    currency: string;
    includedInTotal?: boolean;
    label: string;
  }>;
  mode: "demo" | "supabase";
  payments: DemoPayment[];
  pdfUrl: string;
};

type FinanceSummary = {
  expensesTotal: number;
  mode: "demo" | "supabase";
  recentExpenses: Array<{
    amount: number;
    category: string;
    createdAt: string;
    currency: string;
    description: string;
    id: string;
  }>;
  monthly: typeof monthlyRevenue;
  outstanding: number;
  paidInvoices: number;
  profitEstimate: number;
  recentPayments: DemoPayment[];
  revenue: number;
};

type SupportDetailData = {
  messages: TicketMessage[];
  mode: "demo" | "supabase";
  ticket: SupportTicket;
};

type WarehouseActivityItem = {
  createdAt: string;
  id: string;
  note: string;
  status: string;
  trackingNumber: string;
};

type WarehouseSite = {
  id: string;
  name: string;
};

type BranchSite = {
  branchType: "HQ" | "Office" | "Warehouse";
  id: string;
  name: string;
};

type NotificationItem = {
  createdAt: string;
  id: string;
  message: string;
  read: boolean;
  title: string;
  type: string;
  userId: string;
};

type NotificationActivityItem = {
  action: string;
  createdAt: string;
  id: string;
  summary: string;
  userEmail: string;
};

type BuyShipDetailData = {
  mode: "demo" | "supabase";
  request: BuyShipRequest;
  statusFlow: Array<{
    complete: boolean;
    status: string;
  }>;
};

function buildBuyShipRequestNumber(id: string) {
  return `BS-${id.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

type OperationsBoardData = {
  action: {
    ctaHref: string;
    ctaLabel: string;
    description: string;
    title: string;
  };
  columns: Array<{
    count: number;
    indicator: string;
    key: string;
    title: string;
    cards: Array<{
      badge?: string;
      badgeClass?: string;
      customer: string;
      footer: string;
      id: string;
      progress?: number;
      route: string;
      title: string;
      tracking: string;
    }>;
  }>;
  metrics: Array<{
    delta: string;
    label: string;
    tone: "blue" | "yellow" | "orange";
    value: string;
  }>;
  mode: "demo" | "supabase";
  stats: Array<{
    label: string;
    value: string;
  }>;
};

type DashboardOverviewData = {
  alerts: Array<{
    href: string;
    label: string;
    value: string;
  }>;
  customerLeaders: Array<{
    customerCode: string;
    name: string;
    outstandingBalance: string;
    shipments: number;
  }>;
  mode: "demo" | "supabase";
  routeLeaders: Array<{
    count: number;
    route: string;
  }>;
  stats: Array<{
    label: string;
    value: string;
  }>;
  statusBreakdown: Array<{
    label: string;
    value: number;
  }>;
  summary: {
    activeCustomers: number;
    activeShipments: number;
    monthlyRevenue: string;
    pendingInvoices: number;
    warehouseUtilization: number;
  };
};

type NotificationCenterData = {
  items: NotificationItem[];
  mode: "demo" | "supabase";
  sentActivity: NotificationActivityItem[];
  unreadCount: number;
};

type SettingsOverviewData = {
  auditLogs: Array<{
    action: string;
    createdAt: string;
    detail?: string;
    id: string;
    module: string;
    summary: string;
    userEmail: string;
  }>;
  branches: BranchConfig[];
  currencies: CurrencyConfig[];
  exchangeRates: Array<{
    effectiveDate: string;
    fromCurrency: string;
    id: string;
    rate: string;
    toCurrency: string;
  }>;
  mode: "demo" | "supabase";
  notificationRules: Array<{
    audience: string;
    channel: string;
    enabled: boolean;
    event: string;
    id: string;
  }>;
  pricingRules: Array<{
    chargeType: ChargeType;
    currency: string;
    id: string;
    price: string;
    range: string;
    shipmentType: string;
  }>;
  roles: SystemRole[];
  users: Array<{
    authUserId: string | null;
    email: string;
    id: string;
    roles: Array<{ assignmentId: string; name: string; roleId: string }>;
    status: string;
  }>;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}

function formatChargeTypeLabel(chargeType: ChargeType) {
  switch (chargeType) {
    case "freight":
      return "Freight";
    case "minimum_charge":
      return "Minimum Charge";
    case "handling_fee":
      return "Handling Fee";
    case "customs_fee":
      return "Customs Fee";
    case "delivery_fee":
      return "Delivery Fee";
    default:
      return "Freight";
  }
}

function formatCurrencyCode(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}

function formatDecimal(value: number, digits = 1) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function titleCase(value: string) {
  return value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getCustomerDisplayName(customer: {
  company_name: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
}) {
  const fullName = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || customer.company_name || customer.email || "Unknown Customer";
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function normalizeWarehouseName(name?: string | null): WarehousePackage["warehouse"] {
  if (name === "Mogadishu HQ" || name === "Muqdisho HQ") {
    return "Mogadishu HQ";
  }

  return "China Warehouse";
}

function getMonthBucket(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
    label: date.toLocaleString("en-US", {
      month: "short",
      timeZone: "UTC",
    }),
  };
}

function buildUsdRateMap(currencies: Array<{ code: string; exchangeRateToUsd: number }>) {
  const rateMap = new Map<string, number>();
  for (const currency of currencies) {
    const code = String(currency.code ?? "USD").toUpperCase();
    rateMap.set(code, code === "USD" ? 1 : Number(currency.exchangeRateToUsd ?? 0));
  }
  rateMap.set("USD", 1);
  return rateMap;
}

function convertAmountToUsd(amount: number, currency: string, rateMap: Map<string, number>) {
  const code = String(currency ?? "USD").toUpperCase();
  const rate = rateMap.get(code) ?? 0;
  if (code === "USD") {
    return amount;
  }
  if (rate <= 0) {
    return 0;
  }
  return amount * rate;
}

function buildMonthlyFinanceSeries(
  invoices: Array<{ createdAt: string; totalAmount: number }>,
  expenses: Array<{ amount: number; createdAt: string }>,
) {
  const monthKeys = new Set<string>();

  for (const invoice of invoices) {
    const bucket = getMonthBucket(invoice.createdAt);
    if (bucket) {
      monthKeys.add(bucket.key);
    }
  }

  for (const expense of expenses) {
    const bucket = getMonthBucket(expense.createdAt);
    if (bucket) {
      monthKeys.add(bucket.key);
    }
  }

  if (monthKeys.size === 0) {
    return monthlyRevenue;
  }

  const sortedKeys = [...monthKeys].sort().slice(-6);
  const revenueByMonth = new Map<string, number>();
  const expenseByMonth = new Map<string, number>();

  for (const invoice of invoices) {
    const bucket = getMonthBucket(invoice.createdAt);
    if (!bucket || !sortedKeys.includes(bucket.key)) {
      continue;
    }

    revenueByMonth.set(
      bucket.key,
      (revenueByMonth.get(bucket.key) ?? 0) + invoice.totalAmount,
    );
  }

  for (const expense of expenses) {
    const bucket = getMonthBucket(expense.createdAt);
    if (!bucket || !sortedKeys.includes(bucket.key)) {
      continue;
    }

    expenseByMonth.set(
      bucket.key,
      (expenseByMonth.get(bucket.key) ?? 0) + expense.amount,
    );
  }

  return sortedKeys.map((key) => {
    const [year, month] = key.split("-");
    const label = new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toLocaleString(
      "en-US",
      {
        month: "short",
        timeZone: "UTC",
      },
    );

    return {
      expenses: expenseByMonth.get(key) ?? 0,
      month: label,
      revenue: revenueByMonth.get(key) ?? 0,
    };
  });
}

function getShipmentProgress(status: DemoShipment["status"]) {
  switch (status) {
    case "pending":
      return 15;
    case "in_transit":
      return 60;
    case "customs_clearance":
      return 72;
    case "in_warehouse":
      return 85;
    case "ready_for_pickup":
      return 95;
    case "delivered":
      return 100;
    default:
      return 0;
  }
}

function mapDemoUser(): AppUserProfile {
  return {
    customerId: demoCustomers[0]?.id,
    email: "admin@direcargo.com",
    id: "demo-user",
    initials: "JD",
    mode: "demo",
    name: "John Doe",
    profileAddress: demoCustomers[0]?.address,
    profileCity: demoCustomers[0]?.city,
    profileCountry: demoCustomers[0]?.country,
    profilePhone: demoCustomers[0]?.phone,
    role: "operations",
  };
}

function getFallbackRoleFromMetadata(user: { user_metadata?: unknown }) {
  if (
    user.user_metadata &&
    typeof user.user_metadata === "object" &&
    "auto_customer" in user.user_metadata &&
    user.user_metadata.auto_customer === true
  ) {
    return "customer";
  }

  return "user";
}

function getDemoNotifications(): NotificationItem[] {
  return [
    {
      createdAt: "2026-06-24 09:40",
      id: "demo-notification-1",
      message: "Shipment AWB-772910 moved to customs clearance.",
      read: false,
      title: "Shipment Update",
      type: "shipment_status_changed",
      userId: "demo-user",
    },
    {
      createdAt: "2026-06-24 08:15",
      id: "demo-notification-2",
      message: "Invoice INV-1004 is awaiting payment confirmation.",
      read: false,
      title: "Invoice Pending",
      type: "invoice_pending",
      userId: "demo-user",
    },
    {
      createdAt: "2026-06-23 16:20",
      id: "demo-notification-3",
      message: "A new support ticket was assigned to your queue.",
      read: true,
      title: "Support Ticket",
      type: "new_support_ticket",
      userId: "demo-user",
    },
    {
      createdAt: "2026-06-23 11:05",
      id: "demo-notification-4",
      message: "Package PKG-204 was received into China Warehouse.",
      read: true,
      title: "Warehouse Receipt",
      type: "package_received",
      userId: "demo-user",
    },
  ];
}

function buildDemoCustomers(): CustomerListItem[] {
  return demoCustomers.map((customer) => ({
    ...customer,
    portalLinked: customer.portalLinked ?? false,
    shipmentCount: demoShipments.filter(
      (shipment) => shipment.customerCode === customer.customerCode,
    ).length,
  }));
}

export const getCurrentAppUser = cache(async (): Promise<AppUserProfile> => {
  if (!hasSupabaseEnv()) {
    return mapDemoUser();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return mapDemoUser();
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const { data: roleRows } = profile?.id
    ? await supabase
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", profile.id)
    : { data: null };

  const rawRole =
    Array.isArray(roleRows) &&
    roleRows[0] &&
    typeof roleRows[0] === "object" &&
    roleRows[0] !== null &&
    "roles" in roleRows[0] &&
    roleRows[0].roles &&
    typeof roleRows[0].roles === "object" &&
    "name" in roleRows[0].roles
      ? String(roleRows[0].roles.name)
      : getFallbackRoleFromMetadata(user);

  const email = user.email ?? profile?.email ?? "unknown@direcargo.com";
  const fallbackName = titleCase(email.split("@")[0] ?? "Dire User");
  const customerProfile =
    profile?.id
      ? await supabase
          .from("customers")
          .select("id, phone, country, city, address")
          .eq("user_id", profile.id)
          .maybeSingle()
      : { data: null };

  return {
    customerId: customerProfile.data?.id,
    email,
    id: profile?.id,
    initials: getInitials(fallbackName) || "DU",
    mode: "supabase",
    name: fallbackName,
    profileAddress: customerProfile.data?.address ?? undefined,
    profileCity: customerProfile.data?.city ?? undefined,
    profileCountry: customerProfile.data?.country ?? undefined,
    profilePhone: customerProfile.data?.phone ?? undefined,
    role: rawRole,
  };
});

export const getNotificationCenterData = cache(
  async (): Promise<NotificationCenterData> => {
  if (!hasSupabaseEnv()) {
    const items = getDemoNotifications();
    return {
      items,
      mode: "demo",
      sentActivity: [],
      unreadCount: items.filter((item) => !item.read).length,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      items: [],
      mode: "supabase",
      sentActivity: [],
      unreadCount: 0,
    };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile?.id) {
    return { items: [], mode: "supabase", sentActivity: [], unreadCount: 0 };
  }

  const notificationClient =
    hasSupabaseServiceRole() ? createAdminClient() : supabase;
  const [{ data, error }, auditLogResponse] = await Promise.all([
    notificationClient
      .from("notifications")
      .select("id, user_id, title, message, type, is_read, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50),
    notificationClient
      .from("audit_logs")
      .select("id, action, created_at, new_value, old_value")
      .eq("module", "notifications")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (error || !data) {
    return {
      items: [],
      mode: "supabase",
      sentActivity: [],
      unreadCount: 0,
    };
  }

  const items = data.map((item) => ({
    createdAt: item.created_at?.replace("T", " ").slice(0, 16) ?? "",
    id: item.id,
    message: item.message,
    read: item.is_read,
    title: item.title,
    type: item.type,
    userId: item.user_id,
  }));

  const sentActivity =
    auditLogResponse.error || !auditLogResponse.data
      ? []
      : auditLogResponse.data.map((entry) => {
          const source =
            (entry.new_value && typeof entry.new_value === "object"
              ? entry.new_value
              : null) ??
            (entry.old_value && typeof entry.old_value === "object"
              ? entry.old_value
              : null);
          const targetUserEmail =
            source && "targetUserEmail" in source
              ? String(source.targetUserEmail)
              : source && "userEmail" in source
                ? String(source.userEmail)
                : "Unknown user";
          const title =
            source && "title" in source ? String(source.title) : "Notification";
          const type =
            source && "type" in source ? String(source.type) : "manual_notice";

          return {
            action: titleCase(String(entry.action ?? "").replaceAll("_", " ")),
            createdAt: entry.created_at?.replace("T", " ").slice(0, 16) ?? "",
            id: entry.id,
            summary: `${title} / ${titleCase(type.replaceAll("_", " "))}`,
            userEmail: targetUserEmail,
          };
        });

  return {
    items,
    mode: "supabase",
    sentActivity,
    unreadCount: items.filter((item) => !item.read).length,
  };
  },
);

export const listCustomers = cache(async (filters?: {
  search?: string | null;
  status?: string | null;
  type?: string | null;
}): Promise<{ items: CustomerListItem[]; mode: "demo" | "supabase" }> => {
  if (!hasSupabaseEnv()) {
    return { items: buildDemoCustomers(), mode: "demo" };
  }

  const supabase = await createClient();
  let query = supabase.from("customers").select("*").order("created_at", {
    ascending: false,
  });

  if (filters?.type) {
    query = query.eq("customer_type", filters.type);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data: customerRows, error } = await query;

  if (error || !customerRows) {
    return { items: buildDemoCustomers(), mode: "demo" };
  }

  const customerIds = customerRows.map((row) => row.id);
  const [{ data: shipmentRows }, { data: invoiceRows }] = await Promise.all([
    customerIds.length
      ? supabase.from("shipments").select("customer_id").in("customer_id", customerIds)
      : Promise.resolve({ data: [] }),
    customerIds.length
      ? supabase
          .from("invoices")
          .select("customer_id, total_amount, status")
          .in("customer_id", customerIds)
      : Promise.resolve({ data: [] }),
  ]);

  const shipmentCounts = new Map<string, number>();
  for (const shipment of shipmentRows ?? []) {
    shipmentCounts.set(
      shipment.customer_id,
      (shipmentCounts.get(shipment.customer_id) ?? 0) + 1,
    );
  }

  const outstandingByCustomer = new Map<string, number>();
  for (const invoice of invoiceRows ?? []) {
    if (invoice.status === "paid") {
      continue;
    }

    outstandingByCustomer.set(
      invoice.customer_id,
      (outstandingByCustomer.get(invoice.customer_id) ?? 0) +
        Number(invoice.total_amount ?? 0),
    );
  }

  const search = filters?.search?.toLowerCase().trim();

  const items = customerRows
    .map((row) => {
      const customerType: DemoCustomer["customerType"] =
        normalizeCustomerType(row.customer_type);
      const status: DemoCustomer["status"] =
        row.status === "pending" || row.status === "suspended"
          ? row.status
          : "active";

      return {
        address: row.address ?? "",
        city: row.city ?? "",
        companyName: row.company_name ?? undefined,
        country: row.country ?? "",
        createdAt: row.created_at?.slice(0, 10) ?? "",
        customerCode: row.customer_code,
        customerType,
        documents: 0,
        email: row.email ?? "",
        id: row.id,
        name: getCustomerDisplayName(row),
        outstandingBalance: formatCurrency(outstandingByCustomer.get(row.id) ?? 0),
        phone: row.phone ?? "",
        portalLinked: Boolean(row.user_id),
        shipmentCount: shipmentCounts.get(row.id) ?? 0,
        status,
        suiteNumber: row.suite_number ?? "-",
      } satisfies CustomerListItem;
    })
    .filter((customer) => {
      if (!search) {
        return true;
      }

      return [
        customer.customerCode,
        customer.suiteNumber,
        customer.name,
        customer.companyName,
        customer.email,
        customer.phone,
        customer.city,
        customer.country,
        customer.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { items, mode: "supabase" };
});

export async function getCustomerDetail(
  id: string,
): Promise<CustomerDetailData | null> {
  if (!hasSupabaseEnv()) {
    const customer = demoCustomers.find((item) => item.id === id);

    if (!customer) {
      return null;
    }

    return {
      customer,
      documents: [
        {
          status: customer.documents > 0 ? "verified" : "missing",
          type: customer.customerType === "business" ? "Business License" : "ID",
        },
      ],
      financialSummary: {
        invoiceCount: demoShipments.filter(
          (shipment) => shipment.customerCode === customer.customerCode,
        ).length,
        outstandingBalance: customer.outstandingBalance,
      },
      mergeHistory: [],
      mode: "demo",
      shipments: demoShipments.filter(
        (shipment) => shipment.customerCode === customer.customerCode,
      ),
    };
  }

  const { items: customers, mode } = await listCustomers();
  const customer = customers.find((item) => item.id === id);

  if (!customer) {
    return null;
  }

  const { items: shipments } = await listShipments();
  const customerShipments = shipments.filter(
    (shipment) => shipment.customerCode === customer.customerCode,
  );
  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const { data: mergeAuditRows } = await supabase
    .from("audit_logs")
    .select("id, user_id, created_at, new_value")
    .eq("module", "customers")
    .eq("action", "merge_customers")
    .order("created_at", { ascending: false })
    .limit(50);
  const profileIds = [
    ...new Set(
      (mergeAuditRows ?? [])
        .map((entry) => entry.user_id)
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  const { data: auditUsers } = profileIds.length
    ? await supabase.from("users").select("id, email").in("id", profileIds)
    : { data: [] };
  const auditUserEmailById = new Map<string, string>();
  for (const user of auditUsers ?? []) {
    if (user.id) {
      auditUserEmailById.set(user.id, user.email ?? "System");
    }
  }
  const mergeHistory = (mergeAuditRows ?? [])
    .map((entry) => {
      const payload =
        entry.new_value && typeof entry.new_value === "object" ? entry.new_value : null;
      const sourceCustomerId =
        payload && "sourceCustomerId" in payload
          ? String(payload.sourceCustomerId)
          : null;
      const targetCustomerId =
        payload && "targetCustomerId" in payload
          ? String(payload.targetCustomerId)
          : null;
      const sourceCustomerCode =
        payload && "sourceCustomerCode" in payload
          ? String(payload.sourceCustomerCode)
          : null;
      const targetCustomerCode =
        payload && "targetCustomerCode" in payload
          ? String(payload.targetCustomerCode)
          : null;

      if (sourceCustomerId !== customer.id && targetCustomerId !== customer.id) {
        return null;
      }

      const movedCounts =
        payload && "movedCounts" in payload && payload.movedCounts && typeof payload.movedCounts === "object"
          ? payload.movedCounts
          : null;
      const shipmentCount =
        movedCounts && "shipments" in movedCounts ? Number(movedCounts.shipments ?? 0) : 0;
      const invoiceCount =
        movedCounts && "invoices" in movedCounts ? Number(movedCounts.invoices ?? 0) : 0;

      return {
        createdAt: entry.created_at?.replace("T", " ").slice(0, 16) ?? "",
        id: entry.id,
        summary:
          sourceCustomerId === customer.id
            ? `${sourceCustomerCode ?? "Source"} merged into ${targetCustomerCode ?? "target"} / ${shipmentCount} shipments / ${invoiceCount} invoices`
            : `${sourceCustomerCode ?? "Source"} merged into ${targetCustomerCode ?? "target"} and this record remained active`,
        userEmail:
          entry.user_id && auditUserEmailById.has(entry.user_id)
            ? auditUserEmailById.get(entry.user_id) ?? "System"
            : "System",
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return {
    customer,
    documents: [
      {
        status: "pending_review",
        type: getCustomerDocumentLabel(customer.customerType),
      },
    ],
    financialSummary: {
      invoiceCount: customerShipments.length,
      outstandingBalance: customer.outstandingBalance,
    },
    mergeHistory,
    mode,
    shipments: customerShipments,
  };
}

export async function getCurrentCustomerProfileData(): Promise<CurrentCustomerProfileData | null> {
  if (!hasSupabaseEnv()) {
    const customer = demoCustomers[0];
    return customer
      ? {
          customer: {
            ...customer,
            companyName: customer.companyName ?? "",
            firstName: customer.name.split(" ")[0] ?? customer.name,
            lastName: customer.name.split(" ").slice(1).join(" "),
          },
          mode: "demo",
        }
      : null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile?.id) {
    return null;
  }

  const { data: customerRow, error } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (error || !customerRow) {
    return null;
  }

  const detail = await getCustomerDetail(customerRow.id);
  if (!detail) {
    return null;
  }

  return {
    customer: {
      ...detail.customer,
      companyName: customerRow.company_name ?? "",
      firstName: customerRow.first_name ?? "",
      lastName: customerRow.last_name ?? "",
    },
    mode: detail.mode,
  };
}

export const listShipments = cache(async (filters?: {
  search?: string | null;
  status?: string | null;
  type?: string | null;
}): Promise<{ items: DemoShipment[]; mode: "demo" | "supabase" }> => {
  if (!hasSupabaseEnv()) {
    return { items: demoShipments, mode: "demo" };
  }

  const supabase = await createClient();
  let query = supabase.from("shipments").select("*").order("created_at", {
    ascending: false,
  });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.type) {
    query = query.eq("shipment_type", filters.type);
  }

  const { data: shipmentRows, error } = await query;

  if (error || !shipmentRows) {
    return { items: demoShipments, mode: "demo" };
  }

  const customerIds = [...new Set(shipmentRows.map((row) => row.customer_id))];
  const shipmentIds = shipmentRows.map((row) => row.id);

  const [{ data: customerRows }, packageResponse, { data: invoiceRows }] =
    await Promise.all([
      customerIds.length
        ? supabase
            .from("customers")
            .select("id, customer_code, first_name, last_name, company_name, email")
            .in("id", customerIds)
        : Promise.resolve({ data: [] }),
      shipmentIds.length
        ? supabase
            .from("shipment_packages")
            .select("shipment_id, weight, volume")
            .in("shipment_id", shipmentIds)
        : Promise.resolve({ data: [] }),
      shipmentIds.length
        ? supabase
            .from("invoices")
            .select("shipment_id, status")
            .in("shipment_id", shipmentIds)
        : Promise.resolve({ data: [] }),
    ]);

  const customerMap = new Map(
    (customerRows ?? []).map((customer) => [customer.id, customer]),
  );
  const packageMetrics = new Map<string, { volume: number; weight: number }>();

  for (const pkg of packageResponse.data ?? []) {
    const current = packageMetrics.get(pkg.shipment_id) ?? { volume: 0, weight: 0 };
    current.weight += Number(pkg.weight ?? 0);
    current.volume += Number(pkg.volume ?? 0);
    packageMetrics.set(pkg.shipment_id, current);
  }

  const invoiceStatusMap = new Map<string, string>();
  for (const invoice of invoiceRows ?? []) {
    if (!invoice.shipment_id || invoiceStatusMap.has(invoice.shipment_id)) {
      continue;
    }

    invoiceStatusMap.set(invoice.shipment_id, invoice.status ?? "draft");
  }

  const search = filters?.search?.toLowerCase().trim();

  const items = shipmentRows
    .map((row) => {
      const customer = customerMap.get(row.customer_id);
      const metrics = packageMetrics.get(row.id) ?? { volume: 0, weight: 0 };
      const invoiceStatus = invoiceStatusMap.get(row.id) ?? "draft";
      const shipmentType: DemoShipment["shipmentType"] =
        row.shipment_type === "SEA"
          ? "SEA"
          : row.shipment_type === "BUY_AND_SHIP"
            ? "BUY_AND_SHIP"
            : "AIR";
      const shipmentStatus: DemoShipment["status"] =
        row.status === "in_transit" ||
        row.status === "customs_clearance" ||
        row.status === "in_warehouse" ||
        row.status === "ready_for_pickup" ||
        row.status === "delivered"
          ? row.status
          : "pending";

      return {
        cbm: formatDecimal(metrics.volume, 1),
        commodity: row.commodity ?? "",
        customer: customer ? getCustomerDisplayName(customer) : "Unknown Customer",
        customerCode: customer?.customer_code ?? "-",
        description: row.description ?? "",
        destination: row.destination_country ?? "Unknown destination",
        expectedArrival: row.expected_arrival ?? "",
        id: row.id,
        invoiceStatus:
          invoiceStatus === "paid"
            ? "paid"
            : invoiceStatus === "overdue"
              ? "overdue"
              : invoiceStatus === "pending"
                ? "pending"
                : "draft",
        location: getShipmentLocationLabel(shipmentStatus),
        origin: row.origin_country ?? "Unknown origin",
        packageCount: Number(row.package_count ?? 1),
        shipmentType,
        status: shipmentStatus,
        trackingNumber: row.tracking_number,
        weight: `${formatDecimal(metrics.weight, 0)} kg`,
      } satisfies DemoShipment;
    })
    .filter((shipment) => {
      if (!search) {
        return true;
      }

      return [
        shipment.trackingNumber,
        shipment.customer,
        shipment.customerCode,
        shipment.origin,
        shipment.destination,
        shipment.location,
        shipment.commodity,
        shipment.description,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { items, mode: "supabase" };
});

export async function getShipmentDetail(
  id: string,
): Promise<ShipmentDetailData | null> {
  if (!hasSupabaseEnv()) {
    const shipment = demoShipments.find((item) => item.id === id);

    if (!shipment) {
      return null;
    }

    return {
      invoiceSummary: {
        balanceDue: 0,
        currency: "USD",
        hasInvoice: false,
        invoiceId: null,
        invoiceNumber: null,
        paymentStatus: "unbilled",
      },
      mode: "demo",
      packages: [
        {
          cbm: shipment.cbm,
          packageCode: `${shipment.trackingNumber}-PKG-1`,
          shelf: shipment.status === "in_warehouse" ? "B2" : null,
          weight: shipment.weight,
        },
      ],
      shipment,
      timeline: shipmentTimeline,
    };
  }

  const { items: shipments, mode } = await listShipments();
  const shipment = shipments.find((item) => item.id === id);

  if (!shipment) {
    return null;
  }

  const supabase = await createClient();
  const [statusResponse, packageResponse, invoiceSummary] = await Promise.all([
    supabase
      .from("shipment_status_history")
      .select("status, notes, created_at")
      .eq("shipment_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("shipment_packages")
      .select("package_code, weight, volume, warehouse_shelf_id")
      .eq("shipment_id", id),
    getShipmentInvoiceSummary(supabase, id),
  ]);

  return {
    invoiceSummary: {
      balanceDue: invoiceSummary.balanceDue,
      currency: invoiceSummary.currency,
      hasInvoice: invoiceSummary.hasInvoice,
      invoiceId: invoiceSummary.invoiceId,
      invoiceNumber: invoiceSummary.invoiceNumber,
      paymentStatus: invoiceSummary.paymentStatus,
    },
    mode,
    packages:
      packageResponse.data && packageResponse.data.length
        ? packageResponse.data.map((pkg, index) => ({
            cbm: formatDecimal(Number(pkg.volume ?? 0), 1),
            packageCode: pkg.package_code ?? `${shipment.trackingNumber}-PKG-${index + 1}`,
            shelf: pkg.warehouse_shelf_id ?? null,
            weight: `${formatDecimal(Number(pkg.weight ?? 0), 0)} kg`,
          }))
        : [
            {
              cbm: shipment.cbm,
              packageCode: `${shipment.trackingNumber}-PKG-1`,
              shelf: null,
              weight: shipment.weight,
            },
          ],
    shipment,
    timeline:
      statusResponse.data && statusResponse.data.length
        ? statusResponse.data.map((event) => ({
            date: event.created_at
              ? new Date(event.created_at).toISOString().slice(0, 16).replace("T", " ")
              : "",
            notes: event.notes ?? "Status updated.",
            status: formatShipmentTimelineStatus(event.status),
          }))
        : shipmentTimeline,
  };
}

export const listInvoices = cache(async (filters?: {
  currency?: string | null;
  customerId?: string | null;
  search?: string | null;
  status?: string | null;
}): Promise<{ items: DemoInvoice[]; mode: "demo" | "supabase"; paidCount: number }> => {
  if (!hasSupabaseEnv()) {
    const search = filters?.search?.toLowerCase().trim();
    const items = demoInvoices.filter((invoice) => {
      const matchesStatus = filters?.status ? invoice.status === filters.status : true;
      const matchesCustomer = filters?.customerId
        ? invoice.customerId === filters.customerId
        : true;
      const matchesCurrency = filters?.currency
        ? invoice.currency === filters.currency
        : true;
      const matchesSearch = search
        ? [
            invoice.invoiceNumber,
            invoice.customerCode,
            invoice.customerName,
            invoice.trackingNumber,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(search)
        : true;
      return matchesStatus && matchesCustomer && matchesCurrency && matchesSearch;
    });

    return { items, mode: "demo", paidCount: demoPayments.length };
  }

  const supabase = await createClient();
  let query = supabase.from("invoices").select("*").order("created_at", {
    ascending: false,
  });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.customerId) {
    query = query.eq("customer_id", filters.customerId);
  }

  if (filters?.currency) {
    query = query.eq("currency", filters.currency);
  }

  const { data: invoiceRows, error } = await query;

  if (error || !invoiceRows) {
    return { items: demoInvoices, mode: "demo", paidCount: demoPayments.length };
  }

  const customerIds = [...new Set(invoiceRows.map((row) => row.customer_id))];
  const shipmentIds = invoiceRows
    .map((row) => row.shipment_id)
    .filter((value): value is string => Boolean(value));
  const invoiceIds = invoiceRows.map((row) => row.id);

  const [{ data: customerRows }, { data: shipmentRows }, { data: paymentRows }] =
    await Promise.all([
      customerIds.length
        ? supabase
            .from("customers")
            .select("id, customer_code, first_name, last_name, company_name, email")
            .in("id", customerIds)
        : Promise.resolve({ data: [] }),
      shipmentIds.length
        ? supabase
            .from("shipments")
            .select("id, tracking_number")
            .in("id", shipmentIds)
        : Promise.resolve({ data: [] }),
      invoiceIds.length
        ? supabase.from("payments").select("invoice_id, amount").in("invoice_id", invoiceIds)
        : Promise.resolve({ data: [] }),
    ]);

  const customerMap = new Map(
    (customerRows ?? []).map((customer) => [customer.id, customer]),
  );
  const shipmentMap = new Map(
    (shipmentRows ?? []).map((shipment) => [shipment.id, shipment]),
  );
  const paidByInvoiceId = new Map<string, number>();
  for (const payment of paymentRows ?? []) {
    paidByInvoiceId.set(
      payment.invoice_id,
      (paidByInvoiceId.get(payment.invoice_id) ?? 0) + Number(payment.amount ?? 0),
    );
  }

  const search = filters?.search?.toLowerCase().trim();
  const items = invoiceRows
    .map((row) => {
      const customer = customerMap.get(row.customer_id);
      const shipment = row.shipment_id ? shipmentMap.get(row.shipment_id) : null;
      const currency = String(row.currency ?? "USD").toUpperCase();
      const status: DemoInvoice["status"] =
        row.status === "pending" || row.status === "paid" || row.status === "overdue"
          ? row.status
          : "draft";
      const paidAmount = paidByInvoiceId.get(row.id) ?? 0;
      const totalAmount = Number(row.total_amount ?? 0);

      return {
        balanceDue: Math.max(totalAmount - paidAmount, 0),
        createdAt: row.created_at?.slice(0, 10) ?? "",
        currency,
        customsFee: Number(row.customs_fee ?? 0),
        customsFeeMode:
          row.customs_fee_mode === "paid_directly_by_customer"
            ? "paid_directly_by_customer"
            : "included_in_invoice",
        customerCode: customer?.customer_code ?? "-",
        customerId: row.customer_id,
        customerName: customer ? getCustomerDisplayName(customer) : "Unknown Customer",
        deliveryFee: Number(row.delivery_fee ?? 0),
        dueDate: row.created_at?.slice(0, 10) ?? "",
        handlingFee: Number(row.handling_fee ?? 0),
        id: row.id,
        invoiceNumber: row.invoice_number,
        minimumChargeApplied: Boolean(row.minimum_charge_applied),
        paidAmount,
        serviceFee: Number(row.service_fee ?? 0),
        shipmentId: row.shipment_id ?? "",
        status,
        subtotal: Number(row.subtotal ?? 0),
        totalAmount,
        trackingNumber: shipment?.tracking_number ?? "-",
      } satisfies DemoInvoice;
    })
    .filter((invoice) => {
      if (!search) {
        return true;
      }

      return [
        invoice.invoiceNumber,
        invoice.customerCode,
        invoice.customerName,
        invoice.trackingNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return {
    items,
    mode: "supabase",
    paidCount: paymentRows?.length ?? 0,
  };
});

export async function getInvoiceDetail(
  id: string,
): Promise<InvoiceDetailData | null> {
  if (!hasSupabaseEnv()) {
    const invoice = demoInvoices.find((item) => item.id === id);

    if (!invoice) {
      return null;
    }

    return {
      invoice,
      lines: [
        { amount: invoice.subtotal, currency: invoice.currency, label: "Freight charge" },
        ...(invoice.minimumChargeApplied
          ? [{ amount: 0, currency: invoice.currency, label: "Minimum charge applied" }]
          : []),
        ...(invoice.handlingFee
          ? [{ amount: invoice.handlingFee, currency: invoice.currency, label: "Handling fee" }]
          : []),
        ...(invoice.serviceFee
          ? [{ amount: invoice.serviceFee, currency: invoice.currency, label: "Service fee" }]
          : []),
        ...(invoice.customsFee
          ? [
              {
                amount: invoice.customsFee,
                currency: invoice.currency,
                includedInTotal: invoice.customsFeeMode !== "paid_directly_by_customer",
                label:
                  invoice.customsFeeMode === "paid_directly_by_customer"
                    ? "Customs fee (paid directly by customer)"
                    : "Customs fee",
              },
            ]
          : []),
        ...(invoice.deliveryFee
          ? [{ amount: invoice.deliveryFee, currency: invoice.currency, label: "Delivery fee" }]
          : []),
      ],
      mode: "demo",
      payments: demoPayments.filter((payment) => payment.invoiceId === id),
      pdfUrl: `/api/v1/invoices/${id}/pdf`,
    };
  }

  const { items: invoices, mode } = await listInvoices();
  const invoice = invoices.find((item) => item.id === id);

  if (!invoice) {
    return null;
  }

  const supabase = await createClient();
  const { data: paymentRows } = await supabase
    .from("payments")
    .select("*")
    .eq("invoice_id", id)
    .order("payment_date", { ascending: false });

  const payments =
    paymentRows?.map((payment) => ({
      amount: Number(payment.amount ?? 0),
      currency: String(payment.currency ?? "USD").toUpperCase(),
      id: payment.id,
      invoiceId: payment.invoice_id,
      paymentDate: payment.payment_date?.slice(0, 10) ?? "",
      paymentMethod:
        payment.payment_method === "bank_transfer" ||
        payment.payment_method === "mobile_money" ||
        payment.payment_method === "card"
          ? payment.payment_method
          : "cash",
      referenceNumber: payment.reference_number ?? "-",
    } satisfies DemoPayment)) ?? [];

  return {
    invoice,
    lines: [
      { amount: invoice.subtotal, currency: invoice.currency, label: "Freight charge" },
      ...(invoice.minimumChargeApplied
        ? [{ amount: 0, currency: invoice.currency, label: "Minimum charge applied" }]
        : []),
      ...(invoice.handlingFee
        ? [{ amount: invoice.handlingFee, currency: invoice.currency, label: "Handling fee" }]
        : []),
      ...(invoice.serviceFee
        ? [{ amount: invoice.serviceFee, currency: invoice.currency, label: "Service fee" }]
        : []),
      ...(invoice.customsFee
        ? [
            {
              amount: invoice.customsFee,
              currency: invoice.currency,
              includedInTotal: invoice.customsFeeMode !== "paid_directly_by_customer",
              label:
                invoice.customsFeeMode === "paid_directly_by_customer"
                  ? "Customs fee (paid directly by customer)"
                  : "Customs fee",
            },
          ]
        : []),
      ...(invoice.deliveryFee
        ? [{ amount: invoice.deliveryFee, currency: invoice.currency, label: "Delivery fee" }]
        : []),
    ],
    mode,
    payments,
    pdfUrl: `/api/v1/invoices/${id}/pdf`,
  };
}

export const listPayments = cache(async (): Promise<{
  items: DemoPayment[];
  mode: "demo" | "supabase";
}> => {
  if (!hasSupabaseEnv()) {
    return { items: demoPayments, mode: "demo" };
  }

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("payments")
    .select("*")
    .order("payment_date", { ascending: false });

  if (error || !rows) {
    return { items: demoPayments, mode: "demo" };
  }

  return {
    items: rows.map((payment) => ({
      amount: Number(payment.amount ?? 0),
      currency: String(payment.currency ?? "USD").toUpperCase(),
      id: payment.id,
      invoiceId: payment.invoice_id,
      paymentDate: payment.payment_date?.slice(0, 10) ?? "",
      paymentMethod:
        payment.payment_method === "bank_transfer" ||
        payment.payment_method === "mobile_money" ||
        payment.payment_method === "card"
          ? payment.payment_method
          : "cash",
      referenceNumber: payment.reference_number ?? "-",
    })),
    mode: "supabase",
  };
});

export const listExpenses = cache(async (): Promise<{
  items: DemoExpense[];
  mode: "demo" | "supabase";
}> => {
  if (!hasSupabaseEnv()) {
    return { items: demoExpenses, mode: "demo" };
  }

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("expenses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !rows) {
    return { items: demoExpenses, mode: "demo" };
  }

  return {
    items: rows.map((expense) => ({
      amount: Number(expense.amount ?? 0),
      category: expense.category ?? "General",
      createdAt: expense.created_at?.slice(0, 10) ?? "",
      currency: String(expense.currency ?? "USD").toUpperCase(),
      description: expense.description ?? "",
      id: expense.id,
    })),
    mode: "supabase",
  };
});

export const getFinanceSummary = cache(async (): Promise<FinanceSummary> => {
  if (!hasSupabaseEnv()) {
    const usdRateMap = buildUsdRateMap(currencyConfigs);
    const normalizedInvoices = demoInvoices.map((invoice) => ({
      ...invoice,
      totalAmount: convertAmountToUsd(invoice.totalAmount, invoice.currency, usdRateMap),
    }));
    const normalizedExpenses = demoExpenses.map((expense) => ({
      ...expense,
      amount: convertAmountToUsd(expense.amount, expense.currency, usdRateMap),
    }));
    const revenue = normalizedInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const totalExpenses = normalizedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const outstanding = demoInvoices
      .filter((invoice) => ["pending", "overdue"].includes(invoice.status))
      .reduce(
        (sum, invoice) =>
          sum +
          convertAmountToUsd(
            invoice.balanceDue ?? invoice.totalAmount,
            invoice.currency,
            usdRateMap,
          ),
        0,
      );
    const profitEstimate = revenue - totalExpenses;

    return {
      expensesTotal: totalExpenses,
      mode: "demo",
      monthly: buildMonthlyFinanceSeries(normalizedInvoices, normalizedExpenses),
      outstanding,
      paidInvoices: demoInvoices.filter((invoice) => invoice.status === "paid").length,
      profitEstimate,
      recentExpenses: demoExpenses.slice(0, 8),
      recentPayments: demoPayments,
      revenue,
    };
  }

  const [{ items: invoices }, { items: payments }, { items: expenses }, { items: currencies }] = await Promise.all([
    listInvoices(),
    listPayments(),
    listExpenses(),
    listCurrencies(),
  ]);
  const usdRateMap = buildUsdRateMap(currencies);
  const normalizedInvoices = invoices.map((invoice) => ({
    ...invoice,
    totalAmount: convertAmountToUsd(invoice.totalAmount, invoice.currency, usdRateMap),
  }));
  const normalizedExpenses = expenses.map((expense) => ({
    ...expense,
    amount: convertAmountToUsd(expense.amount, expense.currency, usdRateMap),
  }));

  const revenue = normalizedInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const totalExpenses = normalizedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const outstanding = invoices
    .filter((invoice) => invoice.status === "pending" || invoice.status === "overdue")
    .reduce(
      (sum, invoice) =>
        sum +
        convertAmountToUsd(
          invoice.balanceDue ?? invoice.totalAmount,
          invoice.currency,
          usdRateMap,
        ),
      0,
    );

  return {
    expensesTotal: totalExpenses,
    mode: "supabase",
    monthly: buildMonthlyFinanceSeries(normalizedInvoices, normalizedExpenses),
    outstanding,
    paidInvoices: invoices.filter((invoice) => invoice.status === "paid").length,
    profitEstimate: revenue - totalExpenses,
    recentExpenses: expenses.slice(0, 8),
    recentPayments: payments.slice(0, 8),
    revenue,
  };
});

export const listWarehousePackages = cache(async (filters?: {
  search?: string | null;
  status?: string | null;
  warehouse?: string | null;
  zone?: string | null;
}): Promise<{ items: WarehousePackage[]; mode: "demo" | "supabase" }> => {
  if (!hasSupabaseEnv()) {
    const items = warehousePackages.filter((item) => {
      const matchesWarehouse = filters?.warehouse ? item.warehouse === filters.warehouse : true;
      const matchesZone = filters?.zone ? item.zone === filters.zone : true;
      const matchesStatus = filters?.status ? item.status === filters.status : true;
      const search = filters?.search?.toLowerCase();
      const matchesSearch = search
        ? [
            item.packageCode,
            item.customerCode,
            item.customerName,
            item.trackingNumber,
            item.shelf,
          ]
            .join(" ")
            .toLowerCase()
            .includes(search)
        : true;

      return matchesWarehouse && matchesZone && matchesStatus && matchesSearch;
    });

    return { items, mode: "demo" };
  }

  const supabase = await createClient();
  const { data: packageRows, error } = await supabase
    .from("shipment_packages")
    .select("id, shipment_id, package_code, weight, warehouse_shelf_id")
    .order("package_code", { ascending: true });

  if (error || !packageRows) {
    return { items: warehousePackages, mode: "demo" };
  }

  const shipmentIds = [...new Set(packageRows.map((row) => row.shipment_id))];
  const shelfIds = packageRows
    .map((row) => row.warehouse_shelf_id)
    .filter((value): value is string => Boolean(value));

  const [{ data: shipmentRows }, { data: shelfRows }] = await Promise.all([
    shipmentIds.length
        ? supabase
            .from("shipments")
            .select("id, tracking_number, customer_id, status")
            .in("id", shipmentIds)
        : Promise.resolve({ data: [] }),
    shelfIds.length
      ? supabase
          .from("warehouse_shelves")
          .select("id, shelf_code, zone_id")
          .in("id", shelfIds)
      : Promise.resolve({ data: [] }),
  ]);

  const customerIds = [...new Set((shipmentRows ?? []).map((row) => row.customer_id))];
  const zoneIds = [...new Set((shelfRows ?? []).map((row) => row.zone_id))];

    const [{ data: customerRows }, { data: zoneRows }, { data: receiptRows }] = await Promise.all([
      customerIds.length
        ? supabase
            .from("customers")
            .select("id, customer_code, first_name, last_name, company_name, email")
            .in("id", customerIds)
        : Promise.resolve({ data: [] }),
      zoneIds.length
        ? supabase
            .from("warehouse_zones")
            .select("id, zone_name, warehouse_id")
            .in("id", zoneIds)
        : Promise.resolve({ data: [] }),
      shipmentIds.length
        ? supabase
            .from("warehouse_receipts")
            .select("shipment_id, warehouse_id, received_date")
            .in("shipment_id", shipmentIds)
            .order("received_date", { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);

  const warehouseIds = [
    ...new Set([
      ...(zoneRows ?? []).map((row) => row.warehouse_id),
      ...(receiptRows ?? []).map((row) => row.warehouse_id).filter((value): value is string => Boolean(value)),
    ]),
  ];
  const { data: warehouseRows } = warehouseIds.length
    ? await supabase.from("warehouses").select("id, name").in("id", warehouseIds)
    : { data: [] };

  const shipmentMap = new Map((shipmentRows ?? []).map((row) => [row.id, row]));
  const shelfMap = new Map((shelfRows ?? []).map((row) => [row.id, row]));
    const customerMap = new Map((customerRows ?? []).map((row) => [row.id, row]));
    const zoneMap = new Map((zoneRows ?? []).map((row) => [row.id, row]));
    const warehouseMap = new Map((warehouseRows ?? []).map((row) => [row.id, row]));
    const latestReceiptByShipment = new Map<
      string,
      { received_date: string | null; shipment_id: string | null; warehouse_id: string | null }
    >();
    for (const row of receiptRows ?? []) {
      if (row.shipment_id && !latestReceiptByShipment.has(row.shipment_id)) {
        latestReceiptByShipment.set(row.shipment_id, row);
      }
    }
    const search = filters?.search?.toLowerCase().trim();

    const items = packageRows
      .map((row) => {
        const shipment = shipmentMap.get(row.shipment_id);
        const shelf = row.warehouse_shelf_id ? shelfMap.get(row.warehouse_shelf_id) : null;
        const zone = shelf ? zoneMap.get(shelf.zone_id) : null;
        const latestReceipt = latestReceiptByShipment.get(row.shipment_id);
        const receiptWarehouse = latestReceipt?.warehouse_id
          ? warehouseMap.get(latestReceipt.warehouse_id)
          : null;
        const warehouse = zone ? warehouseMap.get(zone.warehouse_id) : receiptWarehouse;
        const customer = shipment ? customerMap.get(shipment.customer_id) : null;
        const customerName = customer ? getCustomerDisplayName(customer) : "Unknown Customer";
        const shipmentStatus = shipment?.status ?? "pending";
        const status: WarehousePackage["status"] =
          shipmentStatus === "ready_for_pickup"
            ? "ready_for_shipment"
            : shelf
              ? "stored"
              : "pending_verification";
        const warehouseName = normalizeWarehouseName(warehouse?.name);

        return {
          customerCode: customer?.customer_code ?? "-",
          customerName,
          id: row.id,
          packageCode: row.package_code,
          receivedAt: latestReceipt?.received_date
            ? new Date(latestReceipt.received_date).toISOString().slice(0, 16).replace("T", " ")
            : "",
          receivedBy: "Warehouse team",
          shelfId: row.warehouse_shelf_id ?? undefined,
          shelf: shelf?.shelf_code ?? "-",
          shipmentId: row.shipment_id,
          status,
          trackingNumber: shipment?.tracking_number ?? "-",
          warehouseId: warehouse?.id,
          warehouse: warehouseName,
          weight: `${formatDecimal(Number(row.weight ?? 0), 0)} kg`,
          zone: zone?.zone_name ?? "-",
        } satisfies WarehousePackage;
      })
      .filter((item) => {
        const shipment = shipmentMap.get(item.shipmentId);
        const shipmentStatus = shipment?.status ?? "pending";
        if (!["pending", "in_warehouse", "ready_for_pickup"].includes(shipmentStatus)) {
          return false;
        }
        return true;
      })
      .filter((item) => {
        const matchesWarehouse = filters?.warehouse ? item.warehouse === filters.warehouse : true;
        const matchesZone = filters?.zone ? item.zone === filters.zone : true;
        const matchesStatus = filters?.status ? item.status === filters.status : true;
        const matchesSearch = search
        ? [
            item.packageCode,
            item.customerCode,
            item.customerName,
            item.trackingNumber,
            item.shelf,
          ]
            .join(" ")
            .toLowerCase()
            .includes(search)
        : true;

      return matchesWarehouse && matchesZone && matchesStatus && matchesSearch;
    });

  return { items, mode: "supabase" };
});

export const listWarehouseZones = cache(async (): Promise<{
  items: WarehouseZone[];
  mode: "demo" | "supabase";
}> => {
  if (!hasSupabaseEnv()) {
    return { items: warehouseZones, mode: "demo" };
  }

  const supabase = await createClient();
  const { data: zoneRows, error } = await supabase
    .from("warehouse_zones")
    .select("id, zone_name, warehouse_id")
    .order("zone_name", { ascending: true });

  if (error || !zoneRows) {
    return { items: warehouseZones, mode: "demo" };
  }

  const zoneIds = zoneRows.map((row) => row.id);
  const { data: shelfRows } = zoneIds.length
    ? await supabase
        .from("warehouse_shelves")
        .select("id, shelf_code, zone_id")
        .in("zone_id", zoneIds)
    : { data: [] };
  const warehouseIds = [...new Set(zoneRows.map((row) => row.warehouse_id))];
  const { data: warehouseRows } = warehouseIds.length
    ? await supabase.from("warehouses").select("id, name").in("id", warehouseIds)
    : { data: [] };
  const shelfByZone = new Map<string, Array<{ id: string; shelf_code: string; zone_id: string }>>();
  const warehouseMap = new Map((warehouseRows ?? []).map((row) => [row.id, row.name]));
  const shelfIds = (shelfRows ?? []).map((shelf) => shelf.id);
  const { data: occupiedPackageRows } = shelfIds.length
    ? await supabase
        .from("shipment_packages")
        .select("package_code, warehouse_shelf_id, shipment_id")
        .in("warehouse_shelf_id", shelfIds)
    : { data: [] };
  const occupiedShipmentIds = [
    ...new Set(
      (occupiedPackageRows ?? [])
        .map((pkg) => pkg.shipment_id)
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  const { data: occupiedShipmentRows } = occupiedShipmentIds.length
    ? await supabase
        .from("shipments")
        .select("id, status")
        .in("id", occupiedShipmentIds)
    : { data: [] };
  const activeShipmentIds = new Set(
    (occupiedShipmentRows ?? [])
      .filter((shipment) => !isShipmentCompleted(shipment.status ?? "pending"))
      .map((shipment) => shipment.id),
  );
  const occupiedPackageByShelfId = new Map(
    (occupiedPackageRows ?? [])
      .filter(
        (pkg) =>
          pkg.warehouse_shelf_id &&
          pkg.shipment_id &&
          activeShipmentIds.has(pkg.shipment_id),
      )
      .map((pkg) => [pkg.warehouse_shelf_id as string, pkg.package_code ?? undefined]),
  );

  for (const shelf of shelfRows ?? []) {
    const current = shelfByZone.get(shelf.zone_id) ?? [];
    current.push(shelf);
    shelfByZone.set(shelf.zone_id, current);
  }

  const items = zoneRows.map((zone) => {
    const shelves = shelfByZone.get(zone.id) ?? [];

    return {
      capacity: shelves.length || 1,
      id: zone.id,
      name: zone.zone_name,
      warehouseId: zone.warehouse_id,
      warehouseName: normalizeWarehouseName(warehouseMap.get(zone.warehouse_id)),
      shelves: shelves.map((shelf) => {
        const packageCode = occupiedPackageByShelfId.get(shelf.id);
        return {
          code: shelf.shelf_code,
          id: shelf.id,
          packageCode,
          status: packageCode ? "occupied" : "available",
        };
      }),
      used: shelves.filter((shelf) => occupiedPackageByShelfId.has(shelf.id)).length,
    } satisfies WarehouseZone;
  });

  return { items, mode: "supabase" };
});

export const listCurrencies = cache(async (): Promise<{
  items: CurrencyConfig[];
  mode: "demo" | "supabase";
}> => {
  if (!hasSupabaseEnv()) {
    return { items: currencyConfigs, mode: "demo" };
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const [currenciesResponse, ratesResponse] = await Promise.all([
    supabase.from("currencies").select("id, code, name, symbol").order("code", { ascending: true }),
    supabase
      .from("exchange_rates")
      .select("from_currency, to_currency, rate, effective_date")
      .eq("to_currency", "USD")
      .order("effective_date", { ascending: false }),
  ]);

  if (currenciesResponse.error || ratesResponse.error) {
    return { items: currencyConfigs, mode: "demo" };
  }

  const latestRateByCurrency = new Map<string, number>();
  for (const rate of ratesResponse.data ?? []) {
    if (!latestRateByCurrency.has(rate.from_currency)) {
      latestRateByCurrency.set(rate.from_currency, Number(rate.rate ?? 0));
    }
  }

  return {
    items: (currenciesResponse.data ?? []).map((currency) => ({
      code: String(currency.code ?? "USD").toUpperCase(),
      exchangeRateToUsd:
        String(currency.code ?? "USD").toUpperCase() === "USD"
          ? 1
          : latestRateByCurrency.get(String(currency.code ?? "USD").toUpperCase()) ?? 0,
      id: currency.id,
      name: currency.name,
      symbol: currency.symbol,
    })),
    mode: "supabase",
  };
});

export async function listRecentWarehouseActivity(): Promise<{
  items: WarehouseActivityItem[];
  mode: "demo" | "supabase";
}> {
  if (!hasSupabaseEnv()) {
    return {
      items: [
        {
          createdAt: "2026-06-24 15:40",
          id: "demo-warehouse-activity-1",
          note: "Package released from China Warehouse shelf B2 for transit to Muqdisho HQ.",
          status: "in_transit",
          trackingNumber: "AWB-659022",
        },
        {
          createdAt: "2026-06-24 11:15",
          id: "demo-warehouse-activity-2",
          note: "Package received at China Warehouse from China Office.",
          status: "in_warehouse",
          trackingNumber: "AWB-772910",
        },
        {
          createdAt: "2026-06-24 10:20",
          id: "demo-warehouse-activity-3",
          note: "Package assigned to shelf A1 after receiving verification.",
          status: "in_warehouse",
          trackingNumber: "AWB-772910",
        },
      ],
      mode: "demo",
    };
  }

  const supabase = await createClient();
  const { data: historyRows, error } = await supabase
    .from("shipment_status_history")
    .select("id, shipment_id, status, notes, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !historyRows) {
    return { items: [], mode: "supabase" };
  }

  const warehouseRows = historyRows.filter((row) => {
    const note = (row.notes ?? "").toLowerCase();
    return (
      note.includes("warehouse") ||
      note.includes("shelf") ||
      row.status === "in_warehouse" ||
      row.status === "ready_for_pickup"
    );
  });

  const shipmentIds = [...new Set(warehouseRows.map((row) => row.shipment_id))];
  const { data: shipmentRows } = shipmentIds.length
    ? await supabase
        .from("shipments")
        .select("id, tracking_number")
        .in("id", shipmentIds)
    : { data: [] };

  const shipmentMap = new Map((shipmentRows ?? []).map((row) => [row.id, row.tracking_number]));

  return {
    items: warehouseRows.slice(0, 10).map((row) => ({
      createdAt: row.created_at
        ? new Date(row.created_at).toISOString().slice(0, 16).replace("T", " ")
        : "",
      id: row.id,
      note: row.notes ?? "Warehouse activity recorded.",
      status: formatShipmentTimelineStatus(row.status),
      trackingNumber: shipmentMap.get(row.shipment_id) ?? "-",
    })),
    mode: "supabase",
  };
}

export async function listWarehouses(): Promise<{
  items: WarehouseSite[];
  mode: "demo" | "supabase";
}> {
  if (!hasSupabaseEnv()) {
    return {
      items: [
        { id: "demo-cn", name: "China Warehouse" },
        { id: "demo-mg", name: "Mogadishu HQ" },
      ],
      mode: "demo",
    };
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const { data, error } = await supabase
    .from("warehouses")
    .select("id, name")
    .order("name", { ascending: true });

  if (error || !data || data.length === 0) {
    return {
      items: [],
      mode: "supabase",
    };
  }

  return {
    items: data.map((item) => ({ id: item.id, name: item.name })),
    mode: "supabase",
  };
}

export async function listBranches(): Promise<{
  items: BranchSite[];
  mode: "demo" | "supabase";
}> {
  if (!hasSupabaseEnv()) {
    return {
      items: branchConfigs.map((branch) => ({
        branchType: branch.branchType,
        id: branch.id,
        name: branch.name,
      })),
      mode: "demo",
    };
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const { data, error } = await supabase
    .from("branches")
    .select("id, name, branch_type")
    .order("name", { ascending: true });

  if (error || !data || data.length === 0) {
    return {
      items: [],
      mode: "supabase",
    };
  }

  return {
    items: data.map((item) => ({
      branchType:
        item.branch_type === "Warehouse"
          ? "Warehouse"
          : item.branch_type === "Office"
            ? "Office"
            : "HQ",
      id: item.id,
      name: item.name,
    })),
    mode: "supabase",
  };
}

export const listSupportTickets = cache(async (filters?: {
  customerId?: string | null;
  priority?: string | null;
  search?: string | null;
  status?: string | null;
}): Promise<{ items: SupportTicket[]; mode: "demo" | "supabase" }> => {
  if (!hasSupabaseEnv()) {
    const search = filters?.search?.toLowerCase().trim();
    const items = supportTickets.filter((ticket) => {
      const matchesStatus = filters?.status ? ticket.status === filters.status : true;
      const matchesPriority = filters?.priority ? ticket.priority === filters.priority : true;
      const matchesCustomer = filters?.customerId ? ticket.customerId === filters.customerId : true;
      const matchesSearch = search
        ? [ticket.ticketNumber, ticket.customerCode, ticket.customerName, ticket.subject]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(search)
        : true;
      return matchesStatus && matchesPriority && matchesCustomer && matchesSearch;
    });

    return { items, mode: "demo" };
  }

  const supabase = await createClient();
  let query = supabase.from("support_tickets").select("*").order("created_at", {
    ascending: false,
  });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.priority) {
    query = query.eq("priority", filters.priority);
  }

  if (filters?.customerId) {
    query = query.eq("customer_id", filters.customerId);
  }

  const { data: ticketRows, error } = await query;

  if (error || !ticketRows) {
    return { items: supportTickets, mode: "demo" };
  }

  const customerIds = [...new Set(ticketRows.map((row) => row.customer_id))];
  const { data: customerRows } = customerIds.length
    ? await supabase
        .from("customers")
        .select("id, customer_code, first_name, last_name, company_name, email")
        .in("id", customerIds)
    : { data: [] };

  const customerMap = new Map((customerRows ?? []).map((row) => [row.id, row]));

  const search = filters?.search?.toLowerCase().trim();
  const items = ticketRows
    .map((row) => {
      const customer = customerMap.get(row.customer_id);
      const status: SupportTicket["status"] =
        row.status === "waiting_customer" || row.status === "resolved" || row.status === "closed"
          ? row.status
          : "open";
      const priority: SupportTicket["priority"] =
        row.priority === "low" || row.priority === "high" || row.priority === "urgent"
          ? row.priority
          : "normal";

      return {
        assignedTo: "Support Desk",
        createdAt: row.created_at?.replace("T", " ").slice(0, 16) ?? "",
        customerCode: customer?.customer_code ?? "-",
        customerId: row.customer_id,
        customerName: customer ? getCustomerDisplayName(customer) : "Unknown Customer",
        id: row.id,
        message: row.message,
        priority,
        status,
        subject: row.subject,
        ticketNumber: row.ticket_number,
        updatedAt: row.created_at?.replace("T", " ").slice(0, 16) ?? "",
      } satisfies SupportTicket;
    })
    .filter((ticket) => {
      if (!search) {
        return true;
      }

      return [ticket.ticketNumber, ticket.customerCode, ticket.customerName, ticket.subject]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { items, mode: "supabase" };
});

export async function getSupportTicketDetail(
  id: string,
): Promise<SupportDetailData | null> {
  if (!hasSupabaseEnv()) {
    const ticket = supportTickets.find((item) => item.id === id);
    if (!ticket) {
      return null;
    }

    return {
      messages: ticketMessages.filter((message) => message.ticketId === id),
      mode: "demo",
      ticket,
    };
  }

  const { items: tickets, mode } = await listSupportTickets();
  const ticket = tickets.find((item) => item.id === id);
  if (!ticket) {
    return null;
  }

  const supabase = await createClient();
  const { data: messageRows } = await supabase
    .from("ticket_messages")
    .select("id, sender_id, message, created_at")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  const senderIds = [...new Set((messageRows ?? []).map((row) => row.sender_id).filter(Boolean))];
  const { data: senderRows } = senderIds.length
    ? await supabase.from("users").select("id, email").in("id", senderIds)
    : { data: [] };
  const senderMap = new Map((senderRows ?? []).map((row) => [row.id, row]));

  const messages = (messageRows ?? []).map((row) => {
    const sender = row.sender_id ? senderMap.get(row.sender_id) : null;
    const senderEmail = sender?.email ?? "support@direcargo.com";
    const senderRole: TicketMessage["senderRole"] = senderEmail.includes("support")
      ? "support"
      : senderEmail.includes("ops") || senderEmail.includes("admin")
        ? "operations"
        : "customer";

    return {
      createdAt: row.created_at?.replace("T", " ").slice(0, 16) ?? "",
      id: row.id,
      message: row.message,
      sender: titleCase(senderEmail.split("@")[0] ?? "Support"),
      senderRole,
      ticketId: id,
    } satisfies TicketMessage;
  });

  return {
    messages:
      messages.length > 0
        ? messages
        : [
            {
              createdAt: ticket.createdAt,
              id: `${id}-seed`,
              message: ticket.message,
              sender: ticket.customerName,
              senderRole: "customer",
              ticketId: id,
            },
          ],
    mode,
    ticket,
  };
}

export async function listBuyShipRequests(filters?: {
  customerId?: string | null;
  search?: string | null;
  status?: string | null;
}): Promise<{ items: BuyShipRequest[]; mode: "demo" | "supabase" }> {
  if (!hasSupabaseEnv()) {
    const items = buyShipRequests.filter((item) => {
      const matchesCustomer = filters?.customerId ? item.customerId === filters.customerId : true;
      const matchesStatus = filters?.status ? item.status === filters.status : true;
      const search = filters?.search?.toLowerCase();
      const matchesSearch = search
        ? [
            item.requestNumber,
            item.customerCode,
            item.customerName,
            item.productName,
            item.supplier,
            item.trackingNumber,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(search)
        : true;

      return matchesCustomer && matchesStatus && matchesSearch;
    });

    return { items, mode: "demo" };
  }

  const supabase = await createClient();
  let query = supabase.from("buy_ship_requests").select("*").order("created_at", {
    ascending: false,
  });

  if (filters?.customerId) {
    query = query.eq("customer_id", filters.customerId);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data: rows, error } = await query;

  if (error || !rows) {
    return { items: buyShipRequests, mode: "demo" };
  }

  const customerIds = [...new Set(rows.map((row) => row.customer_id))];
  const shipmentIds = rows
    .map((row) => row.shipment_id)
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  const [{ data: customerRows }, { data: shipmentRows }, { data: linkedInvoiceRows }] =
    await Promise.all([
      customerIds.length
        ? supabase
            .from("customers")
            .select("id, customer_code, first_name, last_name, company_name, email")
            .in("id", customerIds)
        : Promise.resolve({ data: [] }),
      shipmentIds.length
        ? supabase
            .from("shipments")
            .select("id, tracking_number")
            .in("id", shipmentIds)
        : Promise.resolve({ data: [] }),
      shipmentIds.length
        ? supabase
            .from("invoices")
            .select("id, shipment_id, total_amount")
            .in("shipment_id", shipmentIds)
        : Promise.resolve({ data: [] }),
    ]);

  const customerMap = new Map((customerRows ?? []).map((row) => [row.id, row]));
  const shipmentMap = new Map((shipmentRows ?? []).map((row) => [row.id, row.tracking_number]));
  const linkedInvoiceIds = (linkedInvoiceRows ?? []).map((row) => row.id);
  const { data: linkedPaymentRows } = linkedInvoiceIds.length
    ? await supabase
        .from("payments")
        .select("invoice_id, amount")
        .in("invoice_id", linkedInvoiceIds)
    : { data: [] };
  const invoiceMap = new Map<string, Array<{ id: string; shipment_id: string; total_amount: number }>>();
  for (const row of linkedInvoiceRows ?? []) {
    const current = invoiceMap.get(row.shipment_id) ?? [];
    current.push({
      id: row.id,
      shipment_id: row.shipment_id,
      total_amount: Number(row.total_amount ?? 0),
    });
    invoiceMap.set(row.shipment_id, current);
  }
  const paidByInvoiceId = new Map<string, number>();
  for (const payment of linkedPaymentRows ?? []) {
    paidByInvoiceId.set(
      payment.invoice_id,
      (paidByInvoiceId.get(payment.invoice_id) ?? 0) + Number(payment.amount ?? 0),
    );
  }
  const search = filters?.search?.toLowerCase().trim();

  const items = rows
    .map((row) => {
      const customer = customerMap.get(row.customer_id);
      const status: BuyShipRequest["status"] =
        row.status === "quoted" ||
        row.status === "awaiting_payment" ||
        row.status === "purchased" ||
        row.status === "in_warehouse" ||
        row.status === "converted_to_shipment" ||
        row.status === "cancelled"
          ? row.status
          : "requested";
      const paymentStatus: BuyShipRequest["paymentStatus"] =
        row.shipment_id && invoiceMap.has(row.shipment_id)
          ? invoiceMap
              .get(row.shipment_id)!
              .reduce(
                (summary, invoice) => {
                  summary.total += invoice.total_amount;
                  summary.paid += paidByInvoiceId.get(invoice.id) ?? 0;
                  return summary;
                },
                { paid: 0, total: 0 },
              ).paid >=
            invoiceMap
              .get(row.shipment_id)!
              .reduce((sum, invoice) => sum + invoice.total_amount, 0)
            ? "paid"
            : "pending"
          : status === "converted_to_shipment" || status === "purchased"
            ? "paid"
            : status === "awaiting_payment"
              ? "pending"
              : "not_required";

      return {
        createdAt: row.created_at?.slice(0, 10) ?? "",
        currency: String(row.currency ?? "USD").toUpperCase(),
        customerCode: customer?.customer_code ?? "-",
        customerId: row.customer_id,
        customerName: customer ? getCustomerDisplayName(customer) : "Unknown Customer",
        estimatedPrice: Number(row.estimated_price ?? 0),
        id: row.id,
        paymentStatus,
        pricingBasis:
          row.pricing_basis === "per_item" ? "per_item" : "fixed_total",
        productName: row.product_name,
        purchaseLink: row.purchase_link ?? "#",
        quantity: Number(row.quantity ?? 1),
        requestNumber: buildBuyShipRequestNumber(row.id),
        serviceFee: 0,
        shipmentId:
          row.shipment_id && typeof row.shipment_id === "string" ? row.shipment_id : undefined,
        status,
        supplier: "Supplier pending",
        trackingNumber:
          row.shipment_id && typeof row.shipment_id === "string"
            ? shipmentMap.get(row.shipment_id)
            : undefined,
        unitPrice:
          row.unit_price === null || row.unit_price === undefined
            ? undefined
            : Number(row.unit_price),
      } satisfies BuyShipRequest;
    })
    .filter((item) => {
      if (!search) {
        return true;
      }

      return [
        item.requestNumber,
        item.customerCode,
        item.customerName,
        item.productName,
        item.supplier,
        item.trackingNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

  return { items, mode: "supabase" };
}

export async function getBuyShipDetail(
  id: string,
): Promise<BuyShipDetailData | null> {
  if (!hasSupabaseEnv()) {
    const request = buyShipRequests.find((item) => item.id === id);
    if (!request) {
      return null;
    }

    return {
      mode: "demo",
      request,
      statusFlow: buyShipStatusFlow.map((status) => ({
        complete: buyShipStatusFlow.indexOf(status) <= buyShipStatusFlow.indexOf(request.status),
        status,
      })),
    };
  }

  const { items, mode } = await listBuyShipRequests();
  const request = items.find((item) => item.id === id);
  if (!request) {
    return null;
  }

  return {
    mode,
    request,
    statusFlow: buyShipStatusFlow.map((status) => ({
      complete: buyShipStatusFlow.indexOf(status) <= buyShipStatusFlow.indexOf(request.status),
      status,
    })),
  };
}

export const getReportsSummary = cache(async (): Promise<{
  customers: { active: number; pending: number; topCustomers: Array<{ customerCode: string; name: string; outstandingBalance: string; shipments: number }>; total: number };
  mode: "demo" | "supabase";
  support: {
    byPriority: Record<string, number>;
    byStatus: Record<string, number>;
    open: number;
    resolved: number;
    total: number;
    urgent: number;
  };
  revenue: { expenses: number; monthlyRevenue: typeof monthlyRevenue; profit: number; revenue: number };
  finance: {
    overdueInvoices: Array<{
      amount: number;
      customer: string;
      invoiceNumber: string;
      trackingNumber: string;
    }>;
    topCustomersByRevenue: Array<{
      customer: string;
      customerCode: string;
      revenue: number;
    }>;
  };
  shipments: { byStatus: Record<string, number>; byType: Record<string, number>; topRoutes: Array<{ count: number; route: string }>; total: number };
  warehouse: {
    capacity: Array<{ capacity: number; used: number; utilization: number; zone: string }>;
    packages: number;
    pendingVerification: number;
    readyForShipment: number;
    stored: number;
    byWarehouse: Array<{
      name: string;
      packages: number;
      pendingVerification: number;
      readyForShipment: number;
      stored: number;
    }>;
  };
}> => {
  const [
    customerResult,
    shipmentResult,
    invoiceResult,
    supportResult,
    warehousePackagesResult,
    warehouseZonesResult,
    financeSummary,
  ] = await Promise.all([
    listCustomers(),
    listShipments(),
    listInvoices(),
    listSupportTickets(),
    listWarehousePackages(),
    listWarehouseZones(),
    getFinanceSummary(),
  ]);

  const customers = customerResult.items;
  const shipments = shipmentResult.items;
  const invoices = invoiceResult.items;
  const tickets = supportResult.items;
  const packages = warehousePackagesResult.items;
  const zones = warehouseZonesResult.items;

  const byStatus = shipments.reduce<Record<string, number>>((acc, shipment) => {
    acc[shipment.status] = (acc[shipment.status] ?? 0) + 1;
    return acc;
  }, {});

  const byType = shipments.reduce<Record<string, number>>((acc, shipment) => {
    acc[shipment.shipmentType] = (acc[shipment.shipmentType] ?? 0) + 1;
    return acc;
  }, {});

  const routeMap = shipments.reduce<Record<string, number>>((acc, shipment) => {
    const route = `${shipment.origin} to ${shipment.destination}`;
    acc[route] = (acc[route] ?? 0) + 1;
    return acc;
  }, {});

  const customerRevenueMap = new Map<
    string,
    { customer: string; customerCode: string; revenue: number }
  >();
  for (const invoice of invoices) {
    const current = customerRevenueMap.get(invoice.customerId) ?? {
      customer: invoice.customerName,
      customerCode: invoice.customerCode,
      revenue: 0,
    };
    current.revenue += invoice.totalAmount;
    customerRevenueMap.set(invoice.customerId, current);
  }

  const supportByStatus = tickets.reduce<Record<string, number>>((acc, ticket) => {
    acc[ticket.status] = (acc[ticket.status] ?? 0) + 1;
    return acc;
  }, {});
  const supportByPriority = tickets.reduce<Record<string, number>>((acc, ticket) => {
    acc[ticket.priority] = (acc[ticket.priority] ?? 0) + 1;
    return acc;
  }, {});

  const warehouseByNameMap = packages.reduce<
    Map<
      string,
      {
        name: string;
        packages: number;
        pendingVerification: number;
        readyForShipment: number;
        stored: number;
      }
    >
  >((acc, item) => {
    const current = acc.get(item.warehouse) ?? {
      name: item.warehouse,
      packages: 0,
      pendingVerification: 0,
      readyForShipment: 0,
      stored: 0,
    };
    current.packages += 1;
    if (item.status === "pending_verification") {
      current.pendingVerification += 1;
    }
    if (item.status === "ready_for_shipment") {
      current.readyForShipment += 1;
    }
    if (item.status === "stored") {
      current.stored += 1;
    }
    acc.set(item.warehouse, current);
    return acc;
  }, new Map());

  return {
    customers: {
      active: customers.filter((customer) => customer.status === "active").length,
      pending: customers.filter((customer) => customer.status === "pending").length,
      topCustomers: [...customers]
        .sort((a, b) => b.shipmentCount - a.shipmentCount)
        .slice(0, 10)
        .map((customer) => ({
          customerCode: customer.customerCode,
          name: customer.companyName ?? customer.name,
          outstandingBalance: customer.outstandingBalance,
          shipments: customer.shipmentCount,
        })),
      total: customers.length,
    },
      mode: [customerResult.mode, shipmentResult.mode, warehousePackagesResult.mode].includes("supabase")
        ? "supabase"
        : "demo",
      support: {
        byPriority: supportByPriority,
        byStatus: supportByStatus,
        open: tickets.filter((ticket) => ticket.status === "open").length,
        resolved: tickets.filter((ticket) => ticket.status === "resolved").length,
        total: tickets.length,
        urgent: tickets.filter((ticket) => ticket.priority === "urgent").length,
      },
        revenue: {
          expenses: financeSummary.expensesTotal,
          monthlyRevenue: financeSummary.monthly,
          profit: financeSummary.profitEstimate,
          revenue: financeSummary.revenue,
      },
      finance: {
        overdueInvoices: invoices
          .filter((invoice) => invoice.status === "overdue")
          .sort(
            (a, b) =>
              (b.balanceDue ?? b.totalAmount) - (a.balanceDue ?? a.totalAmount),
          )
          .slice(0, 8)
          .map((invoice) => ({
            amount: invoice.balanceDue ?? invoice.totalAmount,
            customer: invoice.customerName,
            invoiceNumber: invoice.invoiceNumber,
            trackingNumber: invoice.trackingNumber,
          })),
        topCustomersByRevenue: [...customerRevenueMap.values()]
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 8),
      },
      shipments: {
        byStatus,
        byType,
      topRoutes: Object.entries(routeMap)
        .map(([route, count]) => ({ count, route }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      total: shipments.length,
    },
      warehouse: {
        byWarehouse: [...warehouseByNameMap.values()].sort((a, b) => b.packages - a.packages),
        capacity: zones.map((zone) => ({
          capacity: zone.capacity,
          used: zone.used,
          utilization: Math.round((zone.used / Math.max(zone.capacity, 1)) * 100),
          zone: zone.name,
        })),
        packages: packages.length,
        pendingVerification: packages.filter((item) => item.status === "pending_verification").length,
        readyForShipment: packages.filter((item) => item.status === "ready_for_shipment").length,
        stored: packages.filter((item) => item.status === "stored").length,
      },
  };
});

export const getOperationsBoardData = cache(
  async (): Promise<OperationsBoardData> => {
  const [
    shipmentResult,
    invoiceResult,
    supportResult,
    warehousePackagesResult,
    reportsSummary,
  ] = await Promise.all([
    listShipments(),
    listInvoices(),
    listSupportTickets(),
    listWarehousePackages(),
    getReportsSummary(),
  ]);

  const shipments = shipmentResult.items;
  const invoices = invoiceResult.items;
  const tickets = supportResult.items;
  const packages = warehousePackagesResult.items;

  const activeShipments = shipments.filter((shipment) => shipment.status !== "delivered");
  const pendingClearance = shipments.filter(
    (shipment) => shipment.status === "customs_clearance",
  ).length;
  const inTransit = shipments.filter((shipment) => shipment.status === "in_transit").length;
  const totalCapacity = reportsSummary.warehouse.capacity.reduce(
    (sum, zone) => sum + zone.capacity,
    0,
  );
  const usedCapacity = reportsSummary.warehouse.capacity.reduce(
    (sum, zone) => sum + zone.used,
    0,
  );
  const utilization = Math.round((usedCapacity / Math.max(totalCapacity, 1)) * 100);
  const invoicesPending = invoices.filter((invoice) =>
    ["pending", "overdue"].includes(invoice.status),
  ).length;
  const readyForPickup = shipments.filter(
    (shipment) => shipment.status === "ready_for_pickup",
  ).length;
  const pendingVerification = packages.filter(
    (item) => item.status === "pending_verification",
  ).length;
  const openTickets = tickets.filter((ticket) =>
    ["open", "waiting_customer"].includes(ticket.status),
  ).length;

  const action =
    pendingVerification > 0
      ? {
          ctaHref: "/warehouse",
          ctaLabel: "Open Warehouse",
          description: `${formatCount(pendingVerification)} packages await verification or shelf assignment.`,
          title: "Warehouse Attention",
        }
      : pendingClearance > 0
        ? {
            ctaHref: "/shipments?status=customs_clearance",
            ctaLabel: "Review Customs",
            description: `${formatCount(pendingClearance)} shipments are still in customs clearance.`,
            title: "Customs Attention",
          }
        : {
            ctaHref: "/support?status=open",
            ctaLabel: "Open Support",
            description: `${formatCount(openTickets)} active support tickets need follow-up.`,
            title: "Support Follow-up",
          };

  const columnDefinitions = [
    {
      indicator: "bg-outline",
      key: "booking",
      title: "Booking Created",
      shipments: shipments.filter((shipment) => shipment.status === "pending"),
    },
    {
      key: "warehouse",
      indicator: "bg-secondary",
      title: "China Warehouse",
      shipments: shipments.filter((shipment) => shipment.status === "in_warehouse"),
    },
    {
      indicator: "bg-primary",
      key: "transit",
      title: "In Transit to Muqdisho HQ",
      shipments: shipments.filter((shipment) => shipment.status === "in_transit"),
    },
    {
      indicator: "bg-secondary-container",
      key: "hq",
      title: "Muqdisho HQ",
      shipments: shipments.filter((shipment) =>
        ["customs_clearance", "ready_for_pickup"].includes(shipment.status),
      ),
    },
  ];

  return {
    action,
    columns: columnDefinitions.map((column) => ({
      cards: column.shipments.slice(0, 5).map((shipment) => ({
        badge:
          shipment.status === "ready_for_pickup"
            ? "HQ Pickup"
            : shipment.status === "customs_clearance"
              ? "HQ Clearance"
            : shipment.invoiceStatus === "overdue"
              ? "Invoice Overdue"
              : shipment.invoiceStatus === "pending"
                ? "Invoice Pending"
                : shipment.shipmentType,
        badgeClass:
          shipment.status === "ready_for_pickup"
            ? "bg-emerald-50 text-success"
            : shipment.status === "customs_clearance"
              ? "bg-red-50 text-error"
            : shipment.invoiceStatus === "overdue"
              ? "bg-red-50 text-error"
              : shipment.invoiceStatus === "pending"
                ? "bg-yellow-50 text-yellow-800"
                : "bg-surface-container-high text-on-surface-variant",
        customer: shipment.customer,
        footer:
          shipment.expectedArrival &&
          ["pending", "in_warehouse", "in_transit"].includes(shipment.status)
            ? `ETA ${shipment.expectedArrival}`
            : shipment.location,
        id: shipment.id,
        progress: getShipmentProgress(shipment.status),
        route: `${shipment.origin} to ${shipment.destination}`,
        title: `${shipment.shipmentType.replaceAll("_", " ")} shipment`,
        tracking: shipment.trackingNumber,
      })),
      count: column.shipments.length,
      indicator: column.indicator,
      key: column.key,
      title: column.title,
    })),
    metrics: [
      {
        delta: `${formatCount(inTransit)} moving now`,
        label: "Active Shipments",
        tone: "blue",
        value: formatCount(activeShipments.length),
      },
      {
        delta:
          pendingClearance > 0
            ? "Action required"
            : "No customs blockers",
        label: "Pending Clearance",
        tone: "yellow",
        value: formatCount(pendingClearance),
      },
      {
        delta: `${formatCount(usedCapacity)} shelves in use`,
        label: "Warehouse Capacity",
        tone: "orange",
        value: `${utilization}%`,
      },
    ],
    mode: [
      shipmentResult.mode,
      invoiceResult.mode,
      supportResult.mode,
      warehousePackagesResult.mode,
    ].includes("supabase")
      ? "supabase"
      : "demo",
    stats: [
      { label: "At Muqdisho HQ", value: formatCount(readyForPickup) },
      { label: "Invoices Pending", value: formatCount(invoicesPending) },
      { label: "Warehouse Queue", value: formatCount(pendingVerification) },
      { label: "Open Tickets", value: formatCount(openTickets) },
    ],
  };
  },
);

export const getDashboardOverviewData = cache(
  async (): Promise<DashboardOverviewData> => {
  const [reportsSummary, operationsBoard] = await Promise.all([
    getReportsSummary(),
    getOperationsBoardData(),
  ]);

  const monthlyRevenue = reportsSummary.revenue.monthlyRevenue.at(-1)?.revenue ?? 0;
  const pendingInvoices = Number(operationsBoard.stats[1]?.value.replaceAll(",", "") ?? 0);
  const activeShipments = Object.entries(reportsSummary.shipments.byStatus).reduce(
    (sum, [status, count]) => (status === "delivered" ? sum : sum + count),
    0,
  );
  const totalCapacity = reportsSummary.warehouse.capacity.reduce(
    (sum, zone) => sum + zone.capacity,
    0,
  );
  const usedCapacity = reportsSummary.warehouse.capacity.reduce(
    (sum, zone) => sum + zone.used,
    0,
  );
  const warehouseUtilization = Math.round(
    (usedCapacity / Math.max(totalCapacity, 1)) * 100,
  );

  return {
    alerts: [
      {
        href: "/warehouse",
        label: "Warehouse Queue",
        value: operationsBoard.stats[2]?.value ?? "0",
      },
      {
        href: "/support?status=open",
        label: "Open Tickets",
        value: operationsBoard.stats[3]?.value ?? "0",
      },
      {
        href: "/shipments?status=customs_clearance",
        label: "Customs Cases",
        value: reportsSummary.shipments.byStatus.customs_clearance?.toString() ?? "0",
      },
    ],
    customerLeaders: reportsSummary.customers.topCustomers.slice(0, 5),
    mode: reportsSummary.mode,
    routeLeaders: reportsSummary.shipments.topRoutes.slice(0, 5),
    stats: [
      { label: "Total Customers", value: formatCount(reportsSummary.customers.total) },
      { label: "Active Shipments", value: formatCount(activeShipments) },
      { label: "Revenue", value: formatCurrency(reportsSummary.revenue.revenue) },
      { label: "Pending Invoices", value: formatCount(pendingInvoices) },
    ],
    statusBreakdown: Object.entries(reportsSummary.shipments.byStatus)
      .map(([label, value]) => ({ label: titleCase(label.replaceAll("_", " ")), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5),
    summary: {
      activeCustomers: reportsSummary.customers.active,
      activeShipments,
      monthlyRevenue: formatCurrency(monthlyRevenue),
      pendingInvoices,
      warehouseUtilization,
    },
  };
  },
);

export const getSettingsOverviewData = cache(
  async (): Promise<SettingsOverviewData> => {
  if (!hasSupabaseEnv()) {
    return {
      auditLogs: [],
      branches: branchConfigs,
      currencies: currencyConfigs,
      exchangeRates: [],
      mode: "demo",
      notificationRules,
      pricingRules: [],
      roles: systemRoles,
      users: [],
    };
  }

  const supabase = hasSupabaseServiceRole()
    ? createAdminClient()
    : await createClient();
  const [
    rolesResponse,
    userRolesResponse,
    usersResponse,
    branchesResponse,
    currenciesResponse,
    ratesResponse,
    notificationsResponse,
    pricingResponse,
    auditLogsResponse,
  ] =
    await Promise.all([
      supabase.from("roles").select("id, name, description").order("name", { ascending: true }),
      supabase.from("user_roles").select("role_id"),
      supabase.from("users").select("id, auth_user_id, email, status").order("email", { ascending: true }),
      supabase.from("branches").select("id, name, country, city, branch_type, status").order("name", { ascending: true }),
      supabase.from("currencies").select("id, code, name, symbol").order("code", { ascending: true }),
      supabase
        .from("exchange_rates")
        .select("id, from_currency, to_currency, rate, effective_date")
        .eq("to_currency", "USD")
        .order("effective_date", { ascending: false }),
      supabase.from("notifications").select("id, type, is_read, user_id").order("created_at", { ascending: false }).limit(200),
      supabase
        .from("pricing_rules")
        .select("id, shipment_type, charge_type, minimum_value, maximum_value, price, currency")
        .order("shipment_type", { ascending: true })
        .order("charge_type", { ascending: true })
        .order("minimum_value", { ascending: true }),
      supabase
        .from("audit_logs")
        .select("id, user_id, action, module, old_value, new_value, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  if (
    rolesResponse.error ||
    userRolesResponse.error ||
    usersResponse.error ||
    branchesResponse.error ||
    currenciesResponse.error ||
    ratesResponse.error ||
    notificationsResponse.error ||
    pricingResponse.error ||
    auditLogsResponse.error
  ) {
    return {
      auditLogs: [],
      branches: branchConfigs,
      currencies: currencyConfigs,
      mode: "demo",
      exchangeRates: [],
      notificationRules,
      pricingRules: [],
      roles: systemRoles,
      users: [],
    };
  }

  const userRolesByUserResponse = await supabase
    .from("user_roles")
    .select("id, user_id, role_id, roles(name)");

  if (userRolesByUserResponse.error) {
    return {
      auditLogs: [],
      branches: branchConfigs,
      currencies: currencyConfigs,
      exchangeRates: [],
      mode: "demo",
      notificationRules,
      pricingRules: [],
      roles: systemRoles,
      users: [],
    };
  }

  const roleCounts = new Map<string, number>();
  for (const row of userRolesResponse.data ?? []) {
    roleCounts.set(row.role_id, (roleCounts.get(row.role_id) ?? 0) + 1);
  }

  const roles: SystemRole[] = (rolesResponse.data ?? []).map((role) => ({
    description: role.description ?? "Role access scope configured in Supabase.",
    id: role.id,
    modules:
      role.name === "super_admin"
        ? ["all"]
        : role.name === "operations"
          ? ["operations", "shipments", "warehouse"]
          : role.name === "warehouse"
            ? ["warehouse", "shipments"]
            : role.name === "finance"
              ? ["finance", "invoices", "reports"]
              : role.name === "support"
                ? ["support", "customers"]
                : ["portal"],
    name: titleCase(role.name.replaceAll("_", " ")),
    users: roleCounts.get(role.id) ?? 0,
  }));

  const branches: BranchConfig[] = (branchesResponse.data ?? []).map((branch) => ({
    branchType:
      branch.branch_type === "Warehouse"
        ? "Warehouse"
        : branch.branch_type === "Office"
          ? "Office"
          : "HQ",
    city: branch.city,
    country: branch.country,
    id: branch.id,
    name: branch.name,
    status: branch.status === "inactive" ? "inactive" : "active",
  }));

  const latestRateByCurrency = new Map<string, number>();
  for (const rate of ratesResponse.data ?? []) {
    if (!latestRateByCurrency.has(rate.from_currency)) {
      latestRateByCurrency.set(rate.from_currency, Number(rate.rate ?? 0));
    }
  }

  const currencies: CurrencyConfig[] = (currenciesResponse.data ?? []).map((currency) => ({
    id: currency.id,
    code:
      currency.code === "CNY" || currency.code === "SOS" || currency.code === "AED"
        ? currency.code
        : String(currency.code ?? "USD"),
    exchangeRateToUsd:
      currency.code === "USD" ? 1 : latestRateByCurrency.get(currency.code) ?? 0,
    name: currency.name,
    symbol: currency.symbol,
  }));

  const userEmailById = new Map<string, string>();
  for (const user of usersResponse.data ?? []) {
    if (user.id && user.email) {
      userEmailById.set(user.id, user.email);
    }
  }

  const notificationTypeMap = new Map<
    string,
    { event: string; read: number; total: number }
  >();
  for (const notification of notificationsResponse.data ?? []) {
    const current = notificationTypeMap.get(notification.type) ?? {
      event: notification.type,
      read: 0,
      total: 0,
    };
    current.total += 1;
    current.read += notification.is_read ? 1 : 0;
    notificationTypeMap.set(notification.type, current);
  }

  const liveNotificationRules =
    notificationTypeMap.size > 0
      ? [...notificationTypeMap.entries()].map(([type, summary], index) => ({
          audience: "Assigned users",
          channel: "in_app",
          enabled: summary.total > 0,
          event: type,
          id: `notification-${index + 1}`,
        }))
      : notificationRules;

  const exchangeRates = (ratesResponse.data ?? []).map((rate) => ({
    effectiveDate: rate.effective_date,
    fromCurrency: rate.from_currency,
    id: rate.id,
    rate: formatDecimal(Number(rate.rate ?? 0), 6),
    toCurrency: rate.to_currency,
  }));

  const pricingRules = (pricingResponse.data ?? []).map((rule) => ({
    chargeType:
      rule.charge_type === "minimum_charge" ||
      rule.charge_type === "handling_fee" ||
      rule.charge_type === "customs_fee" ||
      rule.charge_type === "delivery_fee"
        ? rule.charge_type
        : "freight",
    currency: rule.currency,
    id: rule.id,
    price: formatCurrencyCode(Number(rule.price ?? 0), rule.currency ?? "USD"),
    range:
      rule.charge_type && rule.charge_type !== "freight"
        ? "Fixed charge"
        : rule.maximum_value === null
          ? `${formatDecimal(Number(rule.minimum_value ?? 0), 0)}+`
          : `${formatDecimal(Number(rule.minimum_value ?? 0), 0)} - ${formatDecimal(Number(rule.maximum_value ?? 0), 0)}`,
    shipmentType: `${titleCase(String(rule.shipment_type ?? "").replaceAll("_", " "))} / ${formatChargeTypeLabel(
      rule.charge_type === "minimum_charge" ||
        rule.charge_type === "handling_fee" ||
        rule.charge_type === "customs_fee" ||
        rule.charge_type === "delivery_fee"
        ? rule.charge_type
        : "freight",
    )}`,
  }));

  const auditLogs = (auditLogsResponse.data ?? []).map((entry) => {
    const source =
      (entry.new_value && typeof entry.new_value === "object" ? entry.new_value : null) ??
      (entry.old_value && typeof entry.old_value === "object" ? entry.old_value : null);
    const isMergeAudit = String(entry.action ?? "") === "merge_customers";
    const mergeSourceCode =
      source && "sourceCustomerCode" in source ? String(source.sourceCustomerCode) : null;
    const mergeTargetCode =
      source && "targetCustomerCode" in source ? String(source.targetCustomerCode) : null;
    const mergeCounts =
      source && "movedCounts" in source && source.movedCounts && typeof source.movedCounts === "object"
        ? source.movedCounts
        : null;
    const summaryParts = isMergeAudit
      ? [`${mergeSourceCode ?? "Source"} into ${mergeTargetCode ?? "target"}`]
      : [
          source && "name" in source ? String(source.name) : null,
          source && "code" in source ? String(source.code) : null,
          source && "email" in source ? String(source.email) : null,
        ].filter(Boolean);
    const detailParts = isMergeAudit
      ? [
          mergeCounts && "shipments" in mergeCounts
            ? `${Number(mergeCounts.shipments ?? 0)} shipments`
            : null,
          mergeCounts && "buy_ship_requests" in mergeCounts
            ? `${Number(mergeCounts.buy_ship_requests ?? 0)} buy & ship`
            : null,
          mergeCounts && "invoices" in mergeCounts
            ? `${Number(mergeCounts.invoices ?? 0)} invoices`
            : null,
          mergeCounts && "support_tickets" in mergeCounts
            ? `${Number(mergeCounts.support_tickets ?? 0)} tickets`
            : null,
        ].filter(Boolean)
      : [];

    return {
      action: titleCase(String(entry.action ?? "").replaceAll("_", " ")),
      createdAt: entry.created_at?.replace("T", " ").slice(0, 16) ?? "",
      detail: detailParts.join(" / ") || undefined,
      id: entry.id,
      module: titleCase(String(entry.module ?? "").replaceAll("_", " ")),
      summary: summaryParts.join(" / ") || "Configuration updated",
      userEmail:
        entry.user_id && userEmailById.has(entry.user_id)
          ? userEmailById.get(entry.user_id) ?? "System"
          : "System",
    };
  });

  const userRoles = new Map<
    string,
    Array<{ assignmentId: string; name: string; roleId: string }>
  >();
  for (const row of userRolesByUserResponse.data ?? []) {
    const roleName =
      row.roles && typeof row.roles === "object" && "name" in row.roles
        ? titleCase(String(row.roles.name).replaceAll("_", " "))
        : "User";
    const current = userRoles.get(row.user_id) ?? [];
    current.push({
      assignmentId: row.id,
      name: roleName,
      roleId: row.role_id,
    });
    userRoles.set(row.user_id, current);
  }

  const users = (usersResponse.data ?? []).map((user) => ({
    authUserId: user.auth_user_id ?? null,
    email: user.email ?? "unknown@direcargo.com",
    id: user.id,
    roles: userRoles.get(user.id) ?? [],
    status: user.status ?? "active",
  }));

  return {
    auditLogs,
    branches,
    currencies,
    exchangeRates,
    mode: "supabase",
    notificationRules: liveNotificationRules,
    pricingRules,
    roles,
    users,
  };
  },
);

export type {
  AppUserProfile,
  BuyShipDetailData,
  CustomerDetailData,
  DashboardOverviewData,
  CustomerListItem,
  FinanceSummary,
  InvoiceDetailData,
  NotificationCenterData,
  NotificationItem,
  OperationsBoardData,
  SettingsOverviewData,
  SupportDetailData,
  WarehouseSite,
  ShipmentDetailData,
};
