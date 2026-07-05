create extension if not exists "pgcrypto";

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  module text not null
);

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text unique,
  phone text,
  password_hash text,
  status text not null default 'active',
  last_login timestamptz,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  unique (user_id, role_id)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  customer_code text unique not null,
  suite_number text unique,
  customer_type text not null,
  first_name text,
  last_name text,
  company_name text,
  email text,
  phone text,
  country text,
  city text,
  address text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table public.customer_documents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  document_type text not null,
  file_url text not null,
  created_at timestamptz not null default now()
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  city text not null,
  branch_type text not null,
  status text not null default 'active'
);

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  name text not null,
  country text not null,
  city text not null
);

create table public.warehouse_zones (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  zone_name text not null
);

create table public.warehouse_shelves (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.warehouse_zones(id) on delete cascade,
  shelf_code text not null
);

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  tracking_number text unique not null,
  customer_id uuid not null references public.customers(id) on delete restrict,
  shipment_type text not null check (shipment_type in ('AIR', 'SEA', 'BUY_AND_SHIP')),
  origin_country text,
  destination_country text,
  status text not null default 'pending',
  expected_arrival date,
  created_at timestamptz not null default now()
);

create table public.shipment_status_history (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  status text not null,
  notes text,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.shipment_packages (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  package_code text unique not null,
  weight numeric,
  length numeric,
  width numeric,
  height numeric,
  volume numeric,
  declared_value numeric,
  warehouse_shelf_id uuid references public.warehouse_shelves(id) on delete set null
);

create table public.shipment_photos (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  photo_url text not null,
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.warehouse_receipts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  shipment_id uuid references public.shipments(id) on delete set null,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  received_date timestamptz not null default now(),
  received_by uuid references public.users(id) on delete set null
);

create table public.customs_clearance (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  status text not null default 'pending',
  notes text,
  cleared_date timestamptz
);

create table public.buy_ship_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  product_name text not null,
  purchase_link text,
  quantity integer not null default 1,
  estimated_price numeric,
  status text not null default 'requested',
  created_at timestamptz not null default now()
);

create table public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  shipment_type text not null,
  minimum_value numeric not null,
  maximum_value numeric,
  price numeric not null,
  currency text not null
);

create table public.currencies (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  symbol text not null
);

create table public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  from_currency text not null,
  to_currency text not null,
  rate numeric not null,
  effective_date date not null
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  customer_id uuid not null references public.customers(id) on delete restrict,
  shipment_id uuid references public.shipments(id) on delete set null,
  currency text not null,
  subtotal numeric not null default 0,
  service_fee numeric not null default 0,
  total_amount numeric not null default 0,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  payment_method text not null,
  amount numeric not null,
  currency text not null,
  reference_number text,
  payment_date timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  amount numeric not null,
  currency text not null,
  description text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text unique not null,
  customer_id uuid not null references public.customers(id) on delete cascade,
  subject text not null,
  message text not null,
  status text not null default 'open',
  priority text not null default 'normal',
  created_at timestamptz not null default now()
);

create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_id uuid references public.users(id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  module text not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

insert into public.roles (name, description)
values
  ('super_admin', 'Full system access'),
  ('operations', 'Shipment and operations access'),
  ('warehouse', 'Warehouse receiving and storage access'),
  ('finance', 'Finance and invoices access'),
  ('support', 'Support ticket access'),
  ('customer', 'Customer portal access')
on conflict (name) do nothing;

insert into public.currencies (code, name, symbol)
values
  ('USD', 'US Dollar', '$'),
  ('CNY', 'Chinese Yuan', '¥'),
  ('SOS', 'Somali Shilling', 'S'),
  ('AED', 'UAE Dirham', 'د.إ')
on conflict (code) do nothing;
