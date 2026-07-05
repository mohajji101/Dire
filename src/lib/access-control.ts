export type AppRole =
  | "super_admin"
  | "operations"
  | "warehouse"
  | "finance"
  | "support"
  | "customer"
  | "user";

export type AppNavLabel =
  | "Dashboard"
  | "Operations"
  | "Customers"
  | "Shipments"
  | "Warehouse"
  | "Buy & Ship"
  | "Finance"
  | "Invoices"
  | "Support"
  | "Reports"
  | "Notifications"
  | "Settings";

const routeAccessRules: Array<{
  pathname: string;
  roles: AppRole[];
}> = [
  { pathname: "/dashboard", roles: ["super_admin"] },
  { pathname: "/operations", roles: ["super_admin", "operations"] },
  { pathname: "/customers", roles: ["super_admin", "support", "operations"] },
  {
    pathname: "/profile",
    roles: ["super_admin", "operations", "warehouse", "finance", "support", "customer"],
  },
  { pathname: "/shipments/new", roles: ["super_admin", "operations"] },
  {
    pathname: "/shipments",
    roles: ["super_admin", "operations", "warehouse", "customer"],
  },
  { pathname: "/warehouse", roles: ["super_admin", "operations", "warehouse"] },
  {
    pathname: "/buy-ship",
    roles: ["super_admin", "operations", "customer"],
  },
  { pathname: "/finance", roles: ["super_admin", "finance"] },
  { pathname: "/invoices", roles: ["super_admin", "finance", "customer"] },
  { pathname: "/support", roles: ["super_admin", "support", "customer"] },
  { pathname: "/reports", roles: ["super_admin", "finance"] },
  {
    pathname: "/notifications",
    roles: ["super_admin", "operations", "warehouse", "finance", "support", "customer"],
  },
  { pathname: "/settings", roles: ["super_admin"] },
];

const homeRouteByRole: Record<AppRole, string> = {
  customer: "/shipments",
  finance: "/finance",
  operations: "/operations",
  support: "/support",
  super_admin: "/dashboard",
  user: "/shipments",
  warehouse: "/warehouse",
};

export function normalizeAppRole(value: string | null | undefined): AppRole {
  switch (value) {
    case "super_admin":
    case "operations":
    case "warehouse":
    case "finance":
    case "support":
    case "customer":
      return value;
    default:
      return "user";
  }
}

export function getDefaultRouteForRole(role: string | null | undefined) {
  return homeRouteByRole[normalizeAppRole(role)];
}

export function canAccessPath(role: string | null | undefined, pathname: string) {
  const normalizedRole = normalizeAppRole(role);
  const rule = routeAccessRules.find(
    (entry) =>
      pathname === entry.pathname || pathname.startsWith(`${entry.pathname}/`),
  );

  if (!rule) {
    return true;
  }

  return rule.roles.includes(normalizedRole);
}

export function canAccessNavItem(role: string | null | undefined, label: AppNavLabel) {
  const rule = routeAccessRules.find((entry) => {
    switch (label) {
      case "Dashboard":
        return entry.pathname === "/dashboard";
      case "Operations":
        return entry.pathname === "/operations";
      case "Customers":
        return entry.pathname === "/customers";
      case "Shipments":
        return entry.pathname === "/shipments";
      case "Warehouse":
        return entry.pathname === "/warehouse";
      case "Buy & Ship":
        return entry.pathname === "/buy-ship";
      case "Finance":
        return entry.pathname === "/finance";
      case "Invoices":
        return entry.pathname === "/invoices";
      case "Support":
        return entry.pathname === "/support";
      case "Reports":
        return entry.pathname === "/reports";
      case "Notifications":
        return entry.pathname === "/notifications";
      case "Settings":
        return entry.pathname === "/settings";
      default:
        return false;
    }
  });

  if (!rule) {
    return true;
  }

  return rule.roles.includes(normalizeAppRole(role));
}
