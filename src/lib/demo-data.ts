export type ShipmentStatus =
  | "pending"
  | "in_transit"
  | "customs_clearance"
  | "in_warehouse"
  | "ready_for_pickup"
  | "delivered";

export type ShipmentType = "AIR" | "SEA" | "BUY_AND_SHIP";

import type { CustomerType } from "@/lib/customer-types";

export type DemoCustomer = {
  id: string;
  customerCode: string;
  suiteNumber: string;
  portalLinked?: boolean;
  customerType: CustomerType;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  status: "active" | "pending" | "suspended";
  createdAt: string;
  documents: number;
  outstandingBalance: string;
};

export type DemoShipment = {
  id: string;
  trackingNumber: string;
  customer: string;
  customerCode: string;
  status: ShipmentStatus;
  shipmentType: ShipmentType;
  origin: string;
  destination: string;
  location: string;
  commodity?: string;
  description?: string;
  packageCount?: number;
  weight: string;
  cbm: string;
  expectedArrival: string;
  invoiceStatus: "draft" | "pending" | "paid" | "overdue";
};

export type WarehouseZone = {
  id: string;
  name: string;
  warehouseId?: string;
  warehouseName?: string;
  capacity: number;
  used: number;
  shelves: Array<{
    id: string;
    code: string;
    status: "available" | "occupied" | "reserved";
    packageCode?: string;
  }>;
};

export type WarehousePackage = {
  id: string;
  packageCode: string;
  customerCode: string;
  customerName: string;
  shipmentId: string;
  trackingNumber: string;
  warehouseId?: string;
  warehouse: "China Warehouse" | "Mogadishu HQ";
  zone: string;
  shelfId?: string;
  shelf: string;
  weight: string;
  status: "pending_verification" | "stored" | "ready_for_shipment";
  receivedAt: string;
  receivedBy: string;
};

export type DemoInvoice = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  shipmentId: string;
  trackingNumber: string;
  currency: string;
  subtotal: number;
  serviceFee: number;
  handlingFee?: number;
  customsFee?: number;
  deliveryFee?: number;
  customsFeeMode?: "included_in_invoice" | "paid_directly_by_customer";
  minimumChargeApplied?: boolean;
  totalAmount: number;
  paidAmount?: number;
  balanceDue?: number;
  status: "draft" | "pending" | "paid" | "overdue";
  createdAt: string;
  dueDate: string;
};

export type DemoPayment = {
  id: string;
  invoiceId: string;
  paymentMethod: "cash" | "bank_transfer" | "mobile_money" | "card";
  amount: number;
  currency: string;
  referenceNumber: string;
  paymentDate: string;
};

export type DemoExpense = {
  id: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
};

export type BuyShipStatus =
  | "requested"
  | "quoted"
  | "awaiting_payment"
  | "purchased"
  | "in_warehouse"
  | "converted_to_shipment"
  | "cancelled";

export type BuyShipRequest = {
  id: string;
  requestNumber: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  productName: string;
  purchaseLink: string;
  supplier: string;
  quantity: number;
  estimatedPrice: number;
  pricingBasis: "fixed_total" | "per_item";
  unitPrice?: number;
  currency: string;
  serviceFee: number;
  status: BuyShipStatus;
  paymentStatus: "not_required" | "pending" | "paid" | "overdue";
  createdAt: string;
  shipmentId?: string;
  trackingNumber?: string;
};

export type SupportTicket = {
  id: string;
  ticketNumber: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  subject: string;
  message: string;
  status: "open" | "waiting_customer" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
};

export type TicketMessage = {
  id: string;
  ticketId: string;
  sender: string;
  senderRole: "customer" | "support" | "operations";
  message: string;
  createdAt: string;
};

export type SystemRole = {
  id: string;
  name: string;
  description: string;
  users: number;
  modules: string[];
};

export type BranchConfig = {
  id: string;
  name: string;
  country: string;
  city: string;
  branchType: "HQ" | "Office" | "Warehouse";
  status: "active" | "inactive";
};

export type CurrencyConfig = {
  id?: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRateToUsd: number;
};

export type NotificationRule = {
  id: string;
  event: string;
  channel: "email" | "sms" | "in_app";
  enabled: boolean;
  audience: string;
};

export const demoShipments: DemoShipment[] = [
  {
    id: "shp_001",
    trackingNumber: "AWB-772910",
    customer: "TechCorp Global",
    customerCode: "DC1001",
    status: "pending",
    shipmentType: "AIR",
    origin: "Shenzhen, China",
    destination: "Mogadishu, Somalia",
    location: "Booking created",
    weight: "420 kg",
    cbm: "3.2",
    expectedArrival: "2026-07-03",
    invoiceStatus: "pending",
  },
  {
    id: "shp_002",
    trackingNumber: "AWB-659022",
    customer: "Somali Auto Parts",
    customerCode: "DC1002",
    status: "in_warehouse",
    shipmentType: "SEA",
    origin: "Guangzhou, China",
    destination: "Berbera, Somalia",
    location: "China Warehouse - Zone B",
    weight: "1,240 kg",
    cbm: "18.5",
    expectedArrival: "2026-07-18",
    invoiceStatus: "draft",
  },
  {
    id: "shp_003",
    trackingNumber: "AWB-441098",
    customer: "Global Customs Ltd",
    customerCode: "DC1003",
    status: "customs_clearance",
    shipmentType: "AIR",
    origin: "Dubai, UAE",
    destination: "Mogadishu, Somalia",
    location: "Muqdisho HQ - Customs Desk",
    weight: "96 kg",
    cbm: "0.8",
    expectedArrival: "2026-06-29",
    invoiceStatus: "overdue",
  },
  {
    id: "shp_004",
    trackingNumber: "AWB-883012",
    customer: "Fabrics International",
    customerCode: "DC1004",
    status: "in_transit",
    shipmentType: "SEA",
    origin: "Mumbai, India",
    destination: "Mogadishu, Somalia",
    location: "At sea",
    weight: "2,800 kg",
    cbm: "24.0",
    expectedArrival: "2026-07-24",
    invoiceStatus: "paid",
  },
  {
    id: "shp_005",
    trackingNumber: "BAS-220184",
    customer: "Aaran Retail Group",
    customerCode: "DC1005",
    status: "ready_for_pickup",
    shipmentType: "BUY_AND_SHIP",
    origin: "Yiwu, China",
    destination: "Mogadishu, Somalia",
    location: "Muqdisho HQ - Pickup Desk",
    weight: "38 kg",
    cbm: "0.4",
    expectedArrival: "2026-06-25",
    invoiceStatus: "paid",
  },
];

export const demoCustomers: DemoCustomer[] = [
  {
    id: "cus_001",
    customerCode: "DC1001",
    suiteNumber: "SU-1001",
    customerType: "business",
    name: "Muna Ali",
    companyName: "TechCorp Global",
    email: "ops@techcorp.example",
    phone: "+252 61 400 1001",
    country: "Somalia",
    city: "Mogadishu",
    address: "KM4 Business District",
    status: "active",
    createdAt: "2026-05-12",
    documents: 4,
    outstandingBalance: "$8,420",
  },
  {
    id: "cus_002",
    customerCode: "DC1002",
    suiteNumber: "SU-1002",
    customerType: "business",
    name: "Hassan Nur",
    companyName: "Somali Auto Parts",
    email: "imports@somaliauto.example",
    phone: "+252 63 820 4400",
    country: "Somalia",
    city: "Hargeisa",
    address: "Industrial Road",
    status: "active",
    createdAt: "2026-04-28",
    documents: 3,
    outstandingBalance: "$2,160",
  },
  {
    id: "cus_003",
    customerCode: "DC1003",
    suiteNumber: "SU-1003",
    customerType: "business",
    name: "Ayaan Warsame",
    companyName: "Global Customs Ltd",
    email: "clearance@globalcustoms.example",
    phone: "+252 61 772 1188",
    country: "Somalia",
    city: "Mogadishu",
    address: "Airport Logistics Park",
    status: "pending",
    createdAt: "2026-06-08",
    documents: 1,
    outstandingBalance: "$1,940",
  },
  {
    id: "cus_004",
    customerCode: "DC1004",
    suiteNumber: "SU-1004",
    customerType: "business",
    name: "Priya Raman",
    companyName: "Fabrics International",
    email: "logistics@fabrics.example",
    phone: "+91 22 4400 8811",
    country: "India",
    city: "Mumbai",
    address: "Textile Export Zone",
    status: "active",
    createdAt: "2026-03-17",
    documents: 5,
    outstandingBalance: "$0",
  },
  {
    id: "cus_005",
    customerCode: "DC1005",
    suiteNumber: "SU-1005",
    customerType: "individual",
    name: "Abdirahman Yusuf",
    companyName: "Aaran Retail Group",
    email: "orders@aaranretail.example",
    phone: "+252 61 900 2244",
    country: "Somalia",
    city: "Mogadishu",
    address: "Bakaaro Market",
    status: "active",
    createdAt: "2026-06-01",
    documents: 2,
    outstandingBalance: "$0",
  },
];

export const shipmentTimeline = [
  {
    status: "Booking created",
    notes: "Shipment record opened and customer package details captured.",
    date: "2026-06-21 09:24",
  },
  {
    status: "China Warehouse",
    notes: "Package scanned into China Warehouse receiving and consolidation.",
    date: "2026-06-22 15:10",
  },
  {
    status: "In transit to Muqdisho HQ",
    notes: "Shipment manifested and moved into the outbound linehaul process.",
    date: "2026-06-23 11:32",
  },
];

export const warehouseZones: WarehouseZone[] = [
  {
    id: "zone_a",
    name: "Zone A",
    capacity: 120,
    used: 86,
    shelves: [
      { id: "a1", code: "A1", status: "occupied", packageCode: "PKG-772910-1" },
      { id: "a2", code: "A2", status: "available" },
      { id: "a3", code: "A3", status: "reserved" },
      { id: "a4", code: "A4", status: "occupied", packageCode: "PKG-220184-1" },
    ],
  },
  {
    id: "zone_b",
    name: "Zone B",
    capacity: 160,
    used: 118,
    shelves: [
      { id: "b1", code: "B1", status: "available" },
      { id: "b2", code: "B2", status: "occupied", packageCode: "PKG-659022-1" },
      { id: "b3", code: "B3", status: "occupied", packageCode: "PKG-659022-2" },
      { id: "b4", code: "B4", status: "reserved" },
    ],
  },
  {
    id: "zone_c",
    name: "Zone C",
    capacity: 90,
    used: 42,
    shelves: [
      { id: "c1", code: "C1", status: "available" },
      { id: "c2", code: "C2", status: "available" },
      { id: "c3", code: "C3", status: "occupied", packageCode: "PKG-883012-1" },
      { id: "c4", code: "C4", status: "available" },
    ],
  },
];

export const warehousePackages: WarehousePackage[] = [
  {
    id: "pkg_001",
    packageCode: "PKG-659022-1",
    customerCode: "DC1002",
    customerName: "Somali Auto Parts",
    shipmentId: "shp_002",
    trackingNumber: "AWB-659022",
    warehouse: "China Warehouse",
    zone: "Zone B",
    shelf: "B2",
    weight: "620 kg",
    status: "stored",
    receivedAt: "2026-06-23 09:15",
    receivedBy: "Li Wei",
  },
  {
    id: "pkg_002",
    packageCode: "PKG-659022-2",
    customerCode: "DC1002",
    customerName: "Somali Auto Parts",
    shipmentId: "shp_002",
    trackingNumber: "AWB-659022",
    warehouse: "China Warehouse",
    zone: "Zone B",
    shelf: "B3",
    weight: "620 kg",
    status: "stored",
    receivedAt: "2026-06-23 09:18",
    receivedBy: "Li Wei",
  },
  {
    id: "pkg_003",
    packageCode: "PKG-220184-1",
    customerCode: "DC1005",
    customerName: "Aaran Retail Group",
    shipmentId: "shp_005",
    trackingNumber: "BAS-220184",
    warehouse: "Mogadishu HQ",
    zone: "Zone A",
    shelf: "A4",
    weight: "38 kg",
    status: "ready_for_shipment",
    receivedAt: "2026-06-22 14:40",
    receivedBy: "Sahra Ali",
  },
  {
    id: "pkg_004",
    packageCode: "PKG-772910-1",
    customerCode: "DC1001",
    customerName: "TechCorp Global",
    shipmentId: "shp_001",
    trackingNumber: "AWB-772910",
    warehouse: "China Warehouse",
    zone: "Zone A",
    shelf: "A1",
    weight: "420 kg",
    status: "pending_verification",
    receivedAt: "2026-06-23 16:05",
    receivedBy: "Chen Yu",
  },
];

export const demoInvoices: DemoInvoice[] = [
  {
    id: "inv_001",
    invoiceNumber: "INV-2026-1001",
    customerId: "cus_001",
    customerCode: "DC1001",
    customerName: "TechCorp Global",
    shipmentId: "shp_001",
    trackingNumber: "AWB-772910",
    currency: "USD",
    subtotal: 7900,
    serviceFee: 520,
    totalAmount: 8420,
    status: "pending",
    createdAt: "2026-06-21",
    dueDate: "2026-07-01",
  },
  {
    id: "inv_002",
    invoiceNumber: "INV-2026-1002",
    customerId: "cus_002",
    customerCode: "DC1002",
    customerName: "Somali Auto Parts",
    shipmentId: "shp_002",
    trackingNumber: "AWB-659022",
    currency: "USD",
    subtotal: 1980,
    serviceFee: 180,
    totalAmount: 2160,
    status: "draft",
    createdAt: "2026-06-23",
    dueDate: "2026-07-08",
  },
  {
    id: "inv_003",
    invoiceNumber: "INV-2026-1003",
    customerId: "cus_003",
    customerCode: "DC1003",
    customerName: "Global Customs Ltd",
    shipmentId: "shp_003",
    trackingNumber: "AWB-441098",
    currency: "USD",
    subtotal: 1740,
    serviceFee: 200,
    totalAmount: 1940,
    status: "overdue",
    createdAt: "2026-06-10",
    dueDate: "2026-06-20",
  },
  {
    id: "inv_004",
    invoiceNumber: "INV-2026-1004",
    customerId: "cus_004",
    customerCode: "DC1004",
    customerName: "Fabrics International",
    shipmentId: "shp_004",
    trackingNumber: "AWB-883012",
    currency: "USD",
    subtotal: 6200,
    serviceFee: 430,
    totalAmount: 6630,
    status: "paid",
    createdAt: "2026-06-14",
    dueDate: "2026-06-24",
  },
  {
    id: "inv_005",
    invoiceNumber: "INV-2026-1005",
    customerId: "cus_005",
    customerCode: "DC1005",
    customerName: "Aaran Retail Group",
    shipmentId: "shp_005",
    trackingNumber: "BAS-220184",
    currency: "CNY",
    subtotal: 1880,
    serviceFee: 140,
    totalAmount: 2020,
    status: "paid",
    createdAt: "2026-06-18",
    dueDate: "2026-06-25",
  },
];

export const demoPayments: DemoPayment[] = [
  {
    id: "pay_001",
    invoiceId: "inv_004",
    paymentMethod: "bank_transfer",
    amount: 6630,
    currency: "USD",
    referenceNumber: "BT-884201",
    paymentDate: "2026-06-20",
  },
  {
    id: "pay_002",
    invoiceId: "inv_005",
    paymentMethod: "mobile_money",
    amount: 2020,
    currency: "CNY",
    referenceNumber: "MM-220184",
    paymentDate: "2026-06-21",
  },
];

export const demoExpenses: DemoExpense[] = [
  {
    id: "exp_001",
    category: "Warehouse Handling",
    amount: 1280,
    currency: "USD",
    description: "China warehouse labor and handling",
    createdAt: "2026-06-20",
  },
  {
    id: "exp_002",
    category: "Customs Processing",
    amount: 740,
    currency: "USD",
    description: "Customs documentation and broker fees",
    createdAt: "2026-06-22",
  },
  {
    id: "exp_003",
    category: "Local Delivery",
    amount: 460,
    currency: "USD",
    description: "Somalia HQ pickup dispatch",
    createdAt: "2026-06-23",
  },
];

export const monthlyRevenue = [
  { month: "Jan", revenue: 42000, expenses: 18000 },
  { month: "Feb", revenue: 51000, expenses: 21000 },
  { month: "Mar", revenue: 58000, expenses: 23500 },
  { month: "Apr", revenue: 69000, expenses: 28000 },
  { month: "May", revenue: 74000, expenses: 31000 },
  { month: "Jun", revenue: 82170, expenses: 2480 },
];

export const buyShipRequests: BuyShipRequest[] = [
  {
    id: "bs_001",
    requestNumber: "BS-2026-001",
    customerId: "cus_005",
    customerCode: "DC1005",
    customerName: "Aaran Retail Group",
    productName: "Retail barcode scanners",
    purchaseLink: "https://supplier.example/scanners",
    supplier: "Yiwu Smart Trade",
    quantity: 12,
    estimatedPrice: 1880,
    pricingBasis: "per_item",
    unitPrice: 156.67,
    currency: "CNY",
    serviceFee: 140,
    status: "converted_to_shipment",
    paymentStatus: "paid",
    createdAt: "2026-06-18",
    shipmentId: "shp_005",
    trackingNumber: "BAS-220184",
  },
  {
    id: "bs_002",
    requestNumber: "BS-2026-002",
    customerId: "cus_001",
    customerCode: "DC1001",
    customerName: "TechCorp Global",
    productName: "Industrial networking switches",
    purchaseLink: "https://supplier.example/switches",
    supplier: "Shenzhen Network Supply",
    quantity: 8,
    estimatedPrice: 3600,
    pricingBasis: "per_item",
    unitPrice: 450,
    currency: "USD",
    serviceFee: 240,
    status: "awaiting_payment",
    paymentStatus: "pending",
    createdAt: "2026-06-22",
  },
  {
    id: "bs_003",
    requestNumber: "BS-2026-003",
    customerId: "cus_002",
    customerCode: "DC1002",
    customerName: "Somali Auto Parts",
    productName: "Brake pad wholesale lot",
    purchaseLink: "https://supplier.example/brake-pads",
    supplier: "Guangzhou Auto Market",
    quantity: 50,
    estimatedPrice: 4250,
    pricingBasis: "fixed_total",
    currency: "USD",
    serviceFee: 310,
    status: "purchased",
    paymentStatus: "paid",
    createdAt: "2026-06-20",
  },
  {
    id: "bs_004",
    requestNumber: "BS-2026-004",
    customerId: "cus_003",
    customerCode: "DC1003",
    customerName: "Global Customs Ltd",
    productName: "Document scanner bundle",
    purchaseLink: "https://supplier.example/doc-scanner",
    supplier: "Dubai Office Equipment",
    quantity: 3,
    estimatedPrice: 980,
    pricingBasis: "fixed_total",
    currency: "USD",
    serviceFee: 90,
    status: "quoted",
    paymentStatus: "not_required",
    createdAt: "2026-06-23",
  },
];

export const buyShipStatusFlow = [
  "requested",
  "quoted",
  "awaiting_payment",
  "purchased",
  "in_warehouse",
  "converted_to_shipment",
];

export const supportTickets: SupportTicket[] = [
  {
    id: "tkt_001",
    ticketNumber: "TKT-2026-001",
    customerId: "cus_001",
    customerCode: "DC1001",
    customerName: "TechCorp Global",
    subject: "Need customs document review",
    message: "Please confirm if the commercial invoice is enough for clearance.",
    status: "open",
    priority: "high",
    assignedTo: "Amina Support",
    createdAt: "2026-06-23 08:30",
    updatedAt: "2026-06-23 11:15",
  },
  {
    id: "tkt_002",
    ticketNumber: "TKT-2026-002",
    customerId: "cus_003",
    customerCode: "DC1003",
    customerName: "Global Customs Ltd",
    subject: "Shipment held at customs",
    message: "The shipment status has not changed since yesterday.",
    status: "waiting_customer",
    priority: "urgent",
    assignedTo: "Omar Support",
    createdAt: "2026-06-22 16:20",
    updatedAt: "2026-06-23 10:04",
  },
  {
    id: "tkt_003",
    ticketNumber: "TKT-2026-003",
    customerId: "cus_005",
    customerCode: "DC1005",
    customerName: "Aaran Retail Group",
    subject: "Pickup timing confirmation",
    message: "Can we collect the Buy & Ship package today afternoon?",
    status: "resolved",
    priority: "normal",
    assignedTo: "Sahra Support",
    createdAt: "2026-06-21 13:12",
    updatedAt: "2026-06-22 09:45",
  },
];

export const ticketMessages: TicketMessage[] = [
  {
    id: "msg_001",
    ticketId: "tkt_001",
    sender: "Muna Ali",
    senderRole: "customer",
    message: "Please confirm if the commercial invoice is enough for clearance.",
    createdAt: "2026-06-23 08:30",
  },
  {
    id: "msg_002",
    ticketId: "tkt_001",
    sender: "Amina Support",
    senderRole: "support",
    message: "We are checking the shipment file and will confirm the missing fields.",
    createdAt: "2026-06-23 09:05",
  },
  {
    id: "msg_003",
    ticketId: "tkt_001",
    sender: "Ops Desk",
    senderRole: "operations",
    message: "Commercial invoice is present. Packing list still needs supplier stamp.",
    createdAt: "2026-06-23 11:15",
  },
  {
    id: "msg_004",
    ticketId: "tkt_002",
    sender: "Ayaan Warsame",
    senderRole: "customer",
    message: "The shipment status has not changed since yesterday.",
    createdAt: "2026-06-22 16:20",
  },
  {
    id: "msg_005",
    ticketId: "tkt_002",
    sender: "Omar Support",
    senderRole: "support",
    message: "Please upload the missing broker authorization so clearance can continue.",
    createdAt: "2026-06-23 10:04",
  },
];

export const systemRoles: SystemRole[] = [
  {
    id: "role_super_admin",
    name: "Super Admin",
    description: "Full access to all modules and settings.",
    users: 2,
    modules: ["all"],
  },
  {
    id: "role_operations",
    name: "Operations",
    description: "Shipment lifecycle, approvals, and warehouse assignment.",
    users: 14,
    modules: ["operations", "shipments", "warehouse"],
  },
  {
    id: "role_warehouse",
    name: "Warehouse",
    description: "Receiving, verification, shelves, and package inventory.",
    users: 22,
    modules: ["warehouse", "shipments"],
  },
  {
    id: "role_finance",
    name: "Finance",
    description: "Invoices, payments, expenses, and revenue reports.",
    users: 8,
    modules: ["finance", "invoices", "reports"],
  },
  {
    id: "role_support",
    name: "Support",
    description: "Ticket queues, customer messaging, and help center.",
    users: 11,
    modules: ["support", "customers"],
  },
  {
    id: "role_customer",
    name: "Customer",
    description: "Customer portal access to own shipments, invoices, and tickets.",
    users: 3824,
    modules: ["portal"],
  },
];

export const branchConfigs: BranchConfig[] = [
  {
    id: "br_mog_hq",
    name: "Muqdisho HQ",
    country: "Somalia",
    city: "Mogadishu",
    branchType: "HQ",
    status: "active",
  },
  {
    id: "br_china_office",
    name: "China Office",
    country: "China",
    city: "Guangzhou",
    branchType: "Office",
    status: "active",
  },
  {
    id: "br_china_warehouse",
    name: "China Warehouse",
    country: "China",
    city: "Yiwu",
    branchType: "Warehouse",
    status: "active",
  },
];

export const currencyConfigs: CurrencyConfig[] = [
  { id: "cur_usd", code: "USD", name: "US Dollar", symbol: "$", exchangeRateToUsd: 1 },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", exchangeRateToUsd: 0.14 },
  { code: "SOS", name: "Somali Shilling", symbol: "S", exchangeRateToUsd: 0.0018 },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", exchangeRateToUsd: 0.27 },
];

export const notificationRules: NotificationRule[] = [
  {
    id: "rule_status_changed",
    event: "shipment_status_changed",
    channel: "in_app",
    enabled: true,
    audience: "Customer and Operations",
  },
  {
    id: "rule_package_received",
    event: "package_received",
    channel: "sms",
    enabled: true,
    audience: "Customer",
  },
  {
    id: "rule_invoice_paid",
    event: "invoice_paid",
    channel: "email",
    enabled: true,
    audience: "Finance",
  },
  {
    id: "rule_new_support_ticket",
    event: "new_support_ticket",
    channel: "in_app",
    enabled: true,
    audience: "Support",
  },
];
