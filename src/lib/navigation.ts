import {
  BarChart3,
  Bell,
  CircleHelp,
  CreditCard,
  Gauge,
  LayoutDashboard,
  ReceiptText,
  Settings,
  ShipWheel,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";

export const navigationItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/operations", icon: Gauge, label: "Operations" },
  { href: "/customers", icon: Users, label: "Customers" },
  { href: "/shipments", icon: Truck, label: "Shipments" },
  { href: "/warehouse", icon: Warehouse, label: "Warehouse" },
  { href: "/buy-ship", icon: ShoppingCart, label: "Buy & Ship" },
  { href: "/finance", icon: CreditCard, label: "Finance" },
  { href: "/invoices", icon: ReceiptText, label: "Invoices" },
  { href: "/support", icon: CircleHelp, label: "Support" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/settings", icon: Settings, label: "Settings" },
] as const;

export const brandIcon = ShipWheel;
