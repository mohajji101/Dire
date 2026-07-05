import {
  BarChart3,
  Boxes,
  CircleHelp,
  ClipboardList,
  CreditCard,
  Gauge,
  LayoutDashboard,
  Bell,
  ReceiptText,
  Settings,
  ShipWheel,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";

export const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Operations", href: "/operations", icon: Gauge },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Shipments", href: "/shipments", icon: Truck },
  { label: "Warehouse", href: "/warehouse", icon: Warehouse },
  { label: "Buy & Ship", href: "/buy-ship", icon: ShoppingCart },
  { label: "Finance", href: "/finance", icon: CreditCard },
  { label: "Invoices", href: "/invoices", icon: ReceiptText },
  { label: "Support", href: "/support", icon: CircleHelp },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const metrics = [
  {
    label: "Active Shipments",
    value: "1,248",
    delta: "+12%",
    icon: Truck,
    tone: "blue",
  },
  {
    label: "Pending Clearance",
    value: "86",
    delta: "Action required",
    icon: ClipboardList,
    tone: "yellow",
  },
  {
    label: "Warehouse Capacity",
    value: "74%",
    delta: "China + Somalia",
    icon: Boxes,
    tone: "orange",
  },
];

type WorkflowCard = {
  tracking: string;
  title: string;
  route: string;
  customer: string;
  badge?: string;
  badgeClass?: string;
  footer: string;
  progress?: number;
};

type WorkflowColumn = {
  title: string;
  count: number;
  indicator: string;
  cards: WorkflowCard[];
};

export const workflowColumns: WorkflowColumn[] = [
  {
    title: "Booking Created",
    count: 3,
    indicator: "bg-outline",
    cards: [
      {
        tracking: "AWB-772910",
        title: "Electronics Container - 40ft HQ",
        route: "Shenzhen (SZX) to Los Angeles (LAX)",
        customer: "TechCorp Global",
        badge: "High Priority",
        badgeClass: "bg-red-50 text-error",
        footer: "2h ago",
      },
      {
        tracking: "AWB-883012",
        title: "Textiles - 20ft Standard",
        route: "Mumbai (BOM) to London (LHR)",
        customer: "Fabrics International",
        footer: "2h ago",
      },
    ],
  },
  {
    title: "In Warehouse",
    count: 1,
    indicator: "bg-secondary",
    cards: [
      {
        tracking: "AWB-659022",
        title: "Auto Parts Consolidations",
        route: "Pending manifest generation",
        customer: "Somali Auto Parts",
        badge: "W/H: DXB-02",
        badgeClass: "bg-surface-container-high text-on-surface-variant",
        progress: 80,
        footer: "Consolidation",
      },
    ],
  },
  {
    title: "Customs Clearance",
    count: 2,
    indicator: "bg-secondary-container",
    cards: [
      {
        tracking: "AWB-441098",
        title: "Medical Supplies",
        route: "Held at port of entry. Commercial invoice missing.",
        customer: "Global Customs Ltd",
        badge: "Docs Missing",
        badgeClass: "bg-red-50 text-error",
        footer: "48h SLA",
      },
    ],
  },
];

export const dashboardStats = [
  { label: "Ready for Pickup", value: "214" },
  { label: "Invoices Pending", value: "$42.8K" },
  { label: "Packages Today", value: "57" },
  { label: "Open Tickets", value: "19" },
];

export const brandIcon = ShipWheel;
