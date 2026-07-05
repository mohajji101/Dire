export const modulePages = {
  dashboard: {
    activeItem: "Dashboard",
    title: "Super Admin Dashboard",
    description:
      "Global control view for customers, active shipments, revenue, invoices, warehouse load, and system activity.",
    stats: [
      { label: "Total Customers", value: "3,842" },
      { label: "Active Shipments", value: "1,248" },
      { label: "Revenue", value: "$184K" },
      { label: "Pending Invoices", value: "312" },
    ],
    sections: [
      "Air vs Sea shipment ratio",
      "Monthly revenue trend",
      "Top customers",
      "Shipment status distribution",
    ],
  },
  customers: {
    activeItem: "Customers",
    title: "Customer Management",
    description:
      "Search customers, manage profiles, inspect shipment history, financial summaries, and documents.",
    stats: [
      { label: "Active Customers", value: "3,214" },
      { label: "Business Accounts", value: "816" },
      { label: "Documents Pending", value: "42" },
      { label: "New This Month", value: "128" },
    ],
    sections: [
      "Customer list and filters",
      "Customer profile",
      "Shipment history",
      "Financial summary and documents",
    ],
  },
  shipments: {
    activeItem: "Shipments",
    title: "Shipment Management",
    description:
      "Manage shipment lists, tracking timelines, package details, photos, status history, invoices, and warehouse links.",
    stats: [
      { label: "Air Shipments", value: "762" },
      { label: "Sea Freight", value: "486" },
      { label: "Buy & Ship", value: "193" },
      { label: "Delayed", value: "27" },
    ],
    sections: [
      "Shipment list",
      "Create shipment form",
      "Tracking timeline",
      "Package photos and invoice link",
    ],
  },
  warehouse: {
    activeItem: "Warehouse",
    title: "Warehouse Management",
    description:
      "Handle China and Somalia receiving, verification, storage capacity, zone maps, shelves, and ready-for-shipment queues.",
    stats: [
      { label: "Received Today", value: "57" },
      { label: "Pending Verification", value: "18" },
      { label: "Stored Packages", value: "940" },
      { label: "Capacity", value: "74%" },
    ],
    sections: [
      "Warehouse overview",
      "Package receiving",
      "Zone and shelf grid",
      "Storage map",
    ],
  },
  buyShip: {
    activeItem: "Buy & Ship",
    title: "Buy & Ship",
    description:
      "Track customer purchase requests, product links, supplier details, request status, and payment state.",
    stats: [
      { label: "Open Requests", value: "92" },
      { label: "Awaiting Payment", value: "21" },
      { label: "Purchased", value: "44" },
      { label: "In Warehouse", value: "17" },
    ],
    sections: [
      "Request list",
      "Request detail",
      "Status flow",
      "Payment status",
    ],
  },
  finance: {
    activeItem: "Finance",
    title: "Finance Dashboard",
    description:
      "Monitor revenue, outstanding payments, paid invoices, expenses, profit estimates, and currency breakdowns.",
    stats: [
      { label: "Total Revenue", value: "$184K" },
      { label: "Outstanding", value: "$42.8K" },
      { label: "Paid Invoices", value: "1,024" },
      { label: "Expenses", value: "$61K" },
    ],
    sections: [
      "Income vs expenses",
      "Currency breakdown",
      "Payment reconciliation",
      "Expense tracking",
    ],
  },
  invoices: {
    activeItem: "Invoices",
    title: "Invoices",
    description:
      "Manage invoice lists, invoice details, charge breakdowns, payment history, and PDF downloads.",
    stats: [
      { label: "Pending", value: "312" },
      { label: "Paid", value: "1,024" },
      { label: "Overdue", value: "36" },
      { label: "Drafts", value: "19" },
    ],
    sections: [
      "Invoice list",
      "Invoice detail",
      "Charges breakdown",
      "Download PDF",
    ],
  },
  support: {
    activeItem: "Support",
    title: "Support Center",
    description:
      "Handle customer support tickets, priorities, message threads, attachments, and status updates.",
    stats: [
      { label: "Open Tickets", value: "19" },
      { label: "High Priority", value: "4" },
      { label: "Waiting Customer", value: "7" },
      { label: "Closed Today", value: "11" },
    ],
    sections: [
      "Ticket list",
      "Ticket detail",
      "Message thread",
      "Attachments and status",
    ],
  },
  reports: {
    activeItem: "Reports",
    title: "Reports & Analytics",
    description:
      "Analyze revenue, shipment performance, customer activity, warehouse efficiency, and air vs sea trends.",
    stats: [
      { label: "Reports Ready", value: "24" },
      { label: "Exports", value: "138" },
      { label: "Top Route", value: "SZX" },
      { label: "Efficiency", value: "91%" },
    ],
    sections: [
      "Revenue reports",
      "Shipment reports",
      "Customer reports",
      "Warehouse efficiency",
    ],
  },
  settings: {
    activeItem: "Settings",
    title: "System Settings",
    description:
      "Configure users, roles, permissions, branches, warehouses, notifications, workflow rules, and currencies.",
    stats: [
      { label: "Users", value: "86" },
      { label: "Roles", value: "6" },
      { label: "Branches", value: "3" },
      { label: "Currencies", value: "4" },
    ],
    sections: [
      "User and role management",
      "Branch and warehouse setup",
      "Notification rules",
      "Currency and pricing rules",
    ],
  },
};
