# Dire Cargo Logistics System - Implementation Documentation

## 1. Current Inputs

### Workspace

- Build target folder: `E:\Dire_Logistics\Dire`
- Current state: folder is empty.
- Git status: not a git repository yet.

### Business/System Documents

- `DIRE CARGO v1.1 - TECHNICAL ARCHITECTURE.pdf`
- `DIRE CARGO v2.0 - UI Screens, Dashboards & API Architecture.pdf`

PDF reading note:

- The PDF files are available on Desktop, but automated PDF extraction/rendering is not ready yet because Poppler tools are missing and Python is not currently runnable from this shell session.
- Before final implementation from PDF details, we should either install/fix PDF tooling or copy the PDF text into the workspace.

### UI/Design Reference Folder

Source folder:

`C:\Users\Haji\Desktop\Dire Logistics\System\stitch_dire_cargo_logistics_system (1)\stitch_dire_cargo_logistics_system`

Detected screens:

- Login
- Logo/brand screen
- Super admin dashboard
- Operations dashboard
- Customer portal dashboard
- Shipment management
- Shipment details and tracking
- Create new shipment
- Warehouse management
- Warehouse inventory management
- Buy and Ship portal
- Buy and Ship Dire Cargo
- Finance dashboard
- Financial control center
- Invoices
- Invoice detail
- Reports and analytics
- Logistics analytics reports
- Support center
- Help center
- Settings
- System settings configuration

The design implementation will follow these screenshots and the included `DESIGN.md`.

## 2. Confirmed Design System

### Brand Feel

The system should feel like a high-trust enterprise logistics control center: dense, clean, operational, and professional. It should not look like a marketing landing page.

### Layout

- Fixed left sidebar on desktop.
- Top navbar with global search and account/actions.
- Main content area with dashboard cards, tables, workflow boards, forms, and detail panels.
- Mobile/tablet sidebar becomes a drawer.
- Max content width around 1440px.
- Base spacing rhythm: 8px.

### Colors

Primary:

- Near black/navy: `#000616`
- Navy container: `#0b1f3b`
- Gold/yellow accent: `#fed255`
- Gold text: `#735a00`
- Background: `#fbf9fb`
- Card/surface: `#ffffff`, `#f5f3f6`, `#efedf0`
- Border: `#c5c6ce`
- Error: `#ba1a1a`

Semantic status colors:

- Pending: yellow/amber
- In transit: blue/navy
- Delivered: green
- Exception/cancelled: red

### Typography

- Headings: Montserrat
- Body text: Open Sans
- Data, labels, inputs, tracking numbers: Inter

### Core UI Components

- Sidebar navigation
- Top search bar
- Metric cards with subtle watermark icons
- Data tables with hover states
- Status badges
- Kanban/workflow board
- Shipment tracking stepper
- Forms for bookings and settings
- Invoice detail layout
- Dashboard charts and summary widgets
- Role-aware navigation and page access

## 3. Proposed Technical Stack

Because the target folder is currently empty, the cleanest path is to scaffold a modern full-stack web app.

Confirmed stack from the PDFs:

- Frontend/app framework: Next.js with React and TypeScript
- Styling: Tailwind CSS using the existing design tokens
- Icons: lucide-react, with Material Symbols only if exact screenshot matching requires it
- Forms: React Hook Form + Zod validation
- Platform/backend: Supabase
- Auth: Supabase Authentication with role-based access
- Database: Supabase PostgreSQL
- Security: Supabase Row Level Security (RLS)
- Storage: Supabase Storage buckets
- Realtime: Supabase Realtime events
- API: Next.js route handlers under `/api/v1`, backed by Supabase service modules
- Charts: Recharts or a similar React charting library
- Testing: unit tests for services, component smoke tests, and end-to-end tests for critical workflows

Why this stack:

- It supports dashboard-heavy UI well.
- It matches the v1.1 and v2.0 architecture PDFs.
- TypeScript helps keep shipment, invoice, customer, warehouse, and finance data consistent.
- Supabase gives us Auth, PostgreSQL, Storage, Realtime, and RLS in one platform.
- Tailwind maps naturally to the provided HTML/design references.

## 4. Main Modules To Build

### Authentication And Roles

Roles expected from the screens:

- Super Admin
- Operations Manager
- Finance user
- Warehouse user
- Customer portal user
- Support user

Core work:

- Login page matching the reference.
- Session handling.
- Role-based sidebar and route protection.
- User profile/menu actions.

### Dashboard / Control Center

Core work:

- Global metrics.
- Operational alerts.
- Shipment volume summaries.
- Finance and warehouse summaries.
- Recent activity.
- Quick actions.

### Operations

Core work:

- Operations board.
- Active shipment workflow.
- Pending clearance.
- Warehouse assignment.
- Approval actions.
- Board/list view switch.

### Shipments

Core work:

- Shipment list with filters/search.
- Shipment creation form.
- Shipment detail page.
- Tracking timeline.
- Documents/manifest status.
- Customer, route, cargo, cost, and warehouse assignment data.

### Customers

Core work:

- Customer list/profile.
- Customer shipment history.
- Customer portal dashboard.
- Customer documents/invoices.

### Warehouse

Core work:

- Warehouse dashboard.
- Inventory management.
- Capacity tracking.
- Assignment queue.
- Location/bin/zone tracking if required by PDF spec.

### Buy And Ship

Core work:

- Customer shopping/forwarding workflow.
- Package request.
- Shipping quote/order.
- Payment/invoice linkage.

### Finance And Invoices

Core work:

- Finance dashboard.
- Invoice list/detail.
- Payment status.
- Revenue/cost/profit summaries.
- Outstanding balances.
- Export/print-ready invoice layout.

### Reports And Analytics

Core work:

- Logistics analytics.
- Finance reports.
- Shipment performance.
- Warehouse utilization.
- Route performance.
- Exportable report views.

### Support

Core work:

- Support center.
- Help center.
- Ticket/request list.
- Customer-facing help content if required.

### Settings

Core work:

- System settings.
- Role/user management.
- Company/branch/warehouse configuration.
- Notification and workflow rules.

## 5. Initial Data Model Draft

Entities to confirm from the PDFs:

- User
- Role
- Customer
- Shipment
- ShipmentItem
- TrackingEvent
- Route
- Warehouse
- WarehouseLocation
- InventoryItem
- Booking
- BuyShipOrder
- Invoice
- InvoiceLine
- Payment
- Document
- SupportTicket
- Notification
- AuditLog
- SystemSetting

Important relationships:

- Customer has many shipments, invoices, support tickets.
- Shipment belongs to customer, route, warehouse, and can have many tracking events/documents/invoice lines.
- Invoice belongs to customer and can be linked to shipment/order.
- Warehouse has many locations and assigned shipments/items.
- User actions should create audit logs for operational traceability.

## 6. API Architecture Draft

Initial API groups:

- `/api/auth/*`
- `/api/users`
- `/api/customers`
- `/api/shipments`
- `/api/shipments/:id/tracking`
- `/api/shipments/:id/documents`
- `/api/warehouses`
- `/api/inventory`
- `/api/buy-ship`
- `/api/invoices`
- `/api/payments`
- `/api/reports`
- `/api/support`
- `/api/settings`
- `/api/notifications`

API rules:

- Validate every request body with schema validation.
- Keep database logic in service modules, not directly inside UI components.
- Enforce role permissions server-side.
- Return consistent error structures.
- Log important mutations in audit logs.

## 7. Implementation Phases

### Phase 0 - Preparation

- Fix/install missing tools. - Done
- Extract text from both PDFs. - Done
- Copy or reference design assets/screenshots.
- Initialize git. - Done
- Scaffold the app. - Done
- Create environment files and README.

### Phase 1 - Foundation

- Create Next.js/TypeScript app. - Done
- Configure Tailwind design tokens. - Started
- Build app shell: sidebar, topbar, layout, responsive behavior. - Started
- Add shared components: buttons, inputs, cards, tables, badges, tabs, dialogs.
- Add seed/mock data for UI development. - Started
- Add login/auth foundation with demo mode and Supabase-ready actions. - Done
- Add route protection proxy for Supabase sessions. - Done

### Phase 2 - Core Screens

- Login.
- Super admin dashboard.
- Operations dashboard.
- Customer management. - Started with list/profile UI
- Shipment management. - Started with list/table UI
- Shipment detail/tracking. - Started with detail/timeline UI
- Create shipment. - Started with form UI
- Warehouse dashboard. - Started with capacity, zones, receiving queue, and package inventory UI
- Buy and Ship. - Started with request list/detail, supplier, payment, and shipment conversion UI
- Finance dashboard. - Started with revenue, expenses, profit, and payment UI
- Invoice list/detail. - Started with invoice table and detail/payment history UI
- Support center. - Started with ticket queue and message thread UI
- Reports and analytics. - Started with revenue, shipment, customer, and warehouse analytics UI
- Settings. - Started with roles, branches, currencies, and notification rules UI

### Phase 3 - Backend And Database

- Add Supabase schema SQL/migrations.
- Add RLS policies.
- Add storage bucket policies.
- Implement Supabase auth/session.
- Implement core APIs. - Started with auth, customer, shipment, warehouse, buy-ship, invoice, payment, reports, support, and settings endpoints
- Add seed data.
- Wire UI to real APIs.

### Phase 4 - Business Workflows

- Shipment lifecycle.
- Warehouse assignment.
- Clearance workflow.
- Invoice/payment workflow.
- Buy and Ship flow.
- Reports and analytics.
- Notifications and audit logs.

### Phase 5 - Verification And Polish

- Responsive checks.
- Visual matching against screenshots.
- Form validation testing.
- API tests.
- End-to-end tests for login, shipment creation, tracking, invoice, and warehouse assignment.
- Production build.

## 8. Local Tools Status

Detected:

- Node.js: installed, version `v25.2.1`
- npm: installed via `npm.cmd`, version `11.6.2`
- Git: installed, version `2.52.0.windows.1`
- pnpm: installed, version `10.33.0`
- Yarn: installed, version `1.22.22`
- Python: installed, version `3.14.3`
- pip: installed, version `25.3`
- Poppler: installed, version `25.07.0`
- Python PDF packages installed:
  - `pypdf`
  - `pdfplumber`
  - `reportlab`
  - `pillow`

Needs attention:

- `npm` in PowerShell is blocked because `npm.ps1` cannot run under current execution policy.
  - Workaround: use `npm.cmd`.
  - Optional fix: adjust PowerShell execution policy if desired.
- The current Codex shell may not see the newly added Poppler PATH until a new terminal/session starts.
  - Poppler is installed at:
    `C:\Users\Haji\AppData\Local\Microsoft\WinGet\Packages\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\poppler-25.07.0\Library\bin`
  - A new PowerShell window should recognize `pdftotext`, `pdfinfo`, and `pdftoppm`.
- Plain `npm` may still fail in PowerShell because of execution policy; use `npm.cmd`.

Recommended before implementation:

- Use `npm.cmd` instead of `npm`.
- Initialize git in `E:\Dire_Logistics\Dire`.

PDF tooling verification:

- `DIRE CARGO v1.1 - TECHNICAL ARCHITECTURE.pdf`: readable, 8 pages.
- `DIRE CARGO v2.0 - UI Screens, Dashboards & API Architecture.pdf`: readable, 12 pages.

## 9. Commands To Start Later

Use these after approval to begin implementation:

```powershell
git init
npm.cmd create next-app@latest . -- --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

If dependency installation fails due network restrictions, it will need approval to run outside the sandbox.

## 10. Immediate Next Step

Before coding starts, confirm one of these paths:

1. Proceed with the confirmed Next.js + TypeScript + Tailwind + Supabase stack.
2. Initialize the project and git repository.
3. Build the foundation screens from the screenshots, then add Supabase integration.

My recommendation: start implementation with the app shell, design system, and core mock-data screens, while preparing Supabase schema/RLS in parallel. This keeps the UI moving while the backend structure stays aligned with the PDFs.
