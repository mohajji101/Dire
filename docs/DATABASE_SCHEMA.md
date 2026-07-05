# Dire Cargo - Supabase Database Schema Draft

This schema is derived from:

- `DIRE CARGO v1.1 - TECHNICAL ARCHITECTURE.pdf`
- `DIRE CARGO v2.0 - UI Screens, Dashboards & API Architecture.pdf`

Target backend: Supabase PostgreSQL with Row Level Security.

## Identity And Access

### users

Application profile table linked to Supabase Auth users.

- `id uuid primary key`
- `auth_user_id uuid unique not null`
- `email text unique`
- `phone text`
- `password_hash text` - legacy/import field only; Supabase Auth owns active password handling.
- `status text not null`
- `last_login timestamptz`
- `created_at timestamptz not null`

### roles

- `id uuid primary key`
- `name text unique not null`
- `description text`

Expected roles:

- `super_admin`
- `operations`
- `warehouse`
- `finance`
- `support`
- `customer`

### permissions

- `id uuid primary key`
- `name text unique not null`
- `module text not null`

### user_roles

- `id uuid primary key`
- `user_id uuid references users(id)`
- `role_id uuid references roles(id)`

## Customers

### customers

- `id uuid primary key`
- `customer_code text unique not null`
- `suite_number text unique`
- `customer_type text not null`
- `first_name text`
- `last_name text`
- `company_name text`
- `email text`
- `phone text`
- `country text`
- `city text`
- `address text`
- `status text not null`
- `created_at timestamptz not null`

### customer_documents

- `id uuid primary key`
- `customer_id uuid references customers(id)`
- `document_type text not null`
- `file_url text not null`
- `created_at timestamptz not null`

## Branch And Warehouse

### branches

- `id uuid primary key`
- `name text not null`
- `country text not null`
- `city text not null`
- `branch_type text not null`
- `status text not null`

Expected examples:

- Muqdisho HQ
- China Office
- China Warehouse

### warehouses

- `id uuid primary key`
- `branch_id uuid references branches(id)`
- `name text not null`
- `country text not null`
- `city text not null`

### warehouse_zones

- `id uuid primary key`
- `warehouse_id uuid references warehouses(id)`
- `zone_name text not null`

Expected zones:

- Zone A
- Zone B
- Zone C

### warehouse_shelves

- `id uuid primary key`
- `zone_id uuid references warehouse_zones(id)`
- `shelf_code text not null`

Expected shelves:

- A1
- A2
- B1
- C3

### warehouse_receipts

- `id uuid primary key`
- `customer_id uuid references customers(id)`
- `shipment_id uuid references shipments(id)`
- `warehouse_id uuid references warehouses(id)`
- `received_date timestamptz not null`
- `received_by uuid references users(id)`

## Shipments

### shipments

- `id uuid primary key`
- `tracking_number text unique not null`
- `customer_id uuid references customers(id)`
- `shipment_type text not null`
- `origin_country text`
- `destination_country text`
- `status text not null`
- `expected_arrival date`
- `created_at timestamptz not null`

Shipment types:

- `AIR`
- `SEA`
- `BUY_AND_SHIP`

### shipment_status_history

- `id uuid primary key`
- `shipment_id uuid references shipments(id)`
- `status text not null`
- `notes text`
- `updated_by uuid references users(id)`
- `created_at timestamptz not null`

### shipment_packages

- `id uuid primary key`
- `shipment_id uuid references shipments(id)`
- `package_code text unique not null`
- `weight numeric`
- `length numeric`
- `width numeric`
- `height numeric`
- `volume numeric`
- `declared_value numeric`
- `warehouse_shelf_id uuid references warehouse_shelves(id)`

### shipment_photos

- `id uuid primary key`
- `shipment_id uuid references shipments(id)`
- `photo_url text not null`
- `uploaded_by uuid references users(id)`
- `created_at timestamptz not null`

### customs_clearance

- `id uuid primary key`
- `shipment_id uuid references shipments(id)`
- `status text not null`
- `notes text`
- `cleared_date timestamptz`

## Buy And Ship

### buy_ship_requests

- `id uuid primary key`
- `customer_id uuid references customers(id)`
- `product_name text not null`
- `purchase_link text`
- `quantity integer not null`
- `estimated_price numeric`
- `status text not null`
- `created_at timestamptz not null`

## Pricing And Currency

### pricing_rules

- `id uuid primary key`
- `shipment_type text not null`
- `minimum_value numeric not null`
- `maximum_value numeric`
- `price numeric not null`
- `currency text not null`

Examples:

- Air: 0-20 KG, 20-100 KG, 100+ KG
- Sea: 1-5 CBM, 5-20 CBM, 20+ CBM

### currencies

- `id uuid primary key`
- `code text unique not null`
- `name text not null`
- `symbol text not null`

Expected currencies:

- USD
- CNY
- SOS
- AED

### exchange_rates

- `id uuid primary key`
- `from_currency text not null`
- `to_currency text not null`
- `rate numeric not null`
- `effective_date date not null`

## Finance

### invoices

- `id uuid primary key`
- `invoice_number text unique not null`
- `customer_id uuid references customers(id)`
- `shipment_id uuid references shipments(id)`
- `currency text not null`
- `subtotal numeric not null`
- `service_fee numeric not null`
- `total_amount numeric not null`
- `status text not null`
- `created_at timestamptz not null`

### payments

- `id uuid primary key`
- `invoice_id uuid references invoices(id)`
- `payment_method text not null`
- `amount numeric not null`
- `currency text not null`
- `reference_number text`
- `payment_date timestamptz not null`

### expenses

- `id uuid primary key`
- `category text not null`
- `amount numeric not null`
- `currency text not null`
- `description text`
- `created_by uuid references users(id)`
- `created_at timestamptz not null`

## Support And Notifications

### support_tickets

- `id uuid primary key`
- `ticket_number text unique not null`
- `customer_id uuid references customers(id)`
- `subject text not null`
- `message text not null`
- `status text not null`
- `priority text not null`
- `created_at timestamptz not null`

### ticket_messages

- `id uuid primary key`
- `ticket_id uuid references support_tickets(id)`
- `sender_id uuid references users(id)`
- `message text not null`
- `created_at timestamptz not null`

### notifications

- `id uuid primary key`
- `user_id uuid references users(id)`
- `title text not null`
- `message text not null`
- `type text not null`
- `is_read boolean not null default false`
- `created_at timestamptz not null`

## Audit

### audit_logs

- `id uuid primary key`
- `user_id uuid references users(id)`
- `action text not null`
- `module text not null`
- `old_value jsonb`
- `new_value jsonb`
- `created_at timestamptz not null`

## Supabase Storage Buckets

- `package-photos` - shipment/package photos
- `customer-documents` - IDs and business documents
- `invoices` - generated invoice PDFs
- `customs-documents` - customs clearance files

## RLS Rules

Customer users can only access:

- Their own profile/customer record.
- Their own shipments.
- Their own invoices and payments.
- Their own support tickets and messages.
- Their own notifications.

Staff users can access only the modules assigned to their role.

Super Admin has full access.

All write actions that change operational state should create `audit_logs` rows.
