alter table public.users enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.customers enable row level security;
alter table public.customer_documents enable row level security;
alter table public.branches enable row level security;
alter table public.warehouses enable row level security;
alter table public.warehouse_zones enable row level security;
alter table public.warehouse_shelves enable row level security;
alter table public.shipments enable row level security;
alter table public.shipment_status_history enable row level security;
alter table public.shipment_packages enable row level security;
alter table public.shipment_photos enable row level security;
alter table public.warehouse_receipts enable row level security;
alter table public.customs_clearance enable row level security;
alter table public.buy_ship_requests enable row level security;
alter table public.pricing_rules enable row level security;
alter table public.currencies enable row level security;
alter table public.exchange_rates enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.support_tickets enable row level security;
alter table public.ticket_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.users where auth_user_id = auth.uid()
$$;

create or replace function public.has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.users u on u.id = ur.user_id
    where u.auth_user_id = auth.uid()
      and r.name = role_name
  )
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('super_admin')
    or public.has_role('operations')
    or public.has_role('warehouse')
    or public.has_role('finance')
    or public.has_role('support')
$$;

create policy "users can read self or staff can read users"
on public.users for select
using (auth_user_id = auth.uid() or public.is_staff());

create policy "staff can read roles"
on public.roles for select
using (
  public.is_staff()
  or exists (
    select 1
    from public.user_roles ur
    where ur.role_id = public.roles.id
      and ur.user_id = public.current_profile_id()
  )
);

create policy "staff can read permissions"
on public.permissions for select
using (public.is_staff());

create policy "staff can read user roles"
on public.user_roles for select
using (public.is_staff() or user_id = public.current_profile_id());

create policy "super admin can manage user roles"
on public.user_roles for all
using (public.has_role('super_admin'))
with check (public.has_role('super_admin'));

create policy "staff can read branches"
on public.branches for select
using (public.is_staff());

create policy "super admin can manage branches"
on public.branches for all
using (public.has_role('super_admin'))
with check (public.has_role('super_admin'));

create policy "staff can read warehouses"
on public.warehouses for select
using (public.is_staff());

create policy "staff can read warehouse zones"
on public.warehouse_zones for select
using (public.is_staff());

create policy "staff can read warehouse shelves"
on public.warehouse_shelves for select
using (public.is_staff());

create policy "staff can read exchange rates"
on public.exchange_rates for select
using (public.is_staff());

create policy "staff can read currencies"
on public.currencies for select
using (public.is_staff());

create policy "super admin can manage currencies"
on public.currencies for all
using (public.has_role('super_admin'))
with check (public.has_role('super_admin'));

create policy "super admin can manage exchange rates"
on public.exchange_rates for all
using (public.has_role('super_admin'))
with check (public.has_role('super_admin'));

create policy "staff can read pricing rules"
on public.pricing_rules for select
using (public.is_staff());

create policy "super admin can manage pricing rules"
on public.pricing_rules for all
using (public.has_role('super_admin'))
with check (public.has_role('super_admin'));

create policy "customers can read own customer profile"
on public.customers for select
using (user_id = public.current_profile_id() or public.is_staff());

create policy "staff can manage customers"
on public.customers for all
using (public.is_staff())
with check (public.is_staff());

create policy "customers can read own buy ship requests"
on public.buy_ship_requests for select
using (
  public.is_staff()
  or customer_id in (
    select id from public.customers where user_id = public.current_profile_id()
  )
);

create policy "customers can create own buy ship requests"
on public.buy_ship_requests for insert
with check (
  public.is_staff()
  or customer_id in (
    select id from public.customers where user_id = public.current_profile_id()
  )
);

create policy "staff can manage buy ship requests"
on public.buy_ship_requests for all
using (public.has_role('super_admin') or public.has_role('operations'))
with check (public.has_role('super_admin') or public.has_role('operations'));

create policy "customers can read own shipments"
on public.shipments for select
using (
  public.is_staff()
  or customer_id in (
    select id from public.customers where user_id = public.current_profile_id()
  )
);

create policy "operations staff can manage shipments"
on public.shipments for all
using (public.has_role('super_admin') or public.has_role('operations'))
with check (public.has_role('super_admin') or public.has_role('operations'));

create policy "customers can read own shipment packages"
on public.shipment_packages for select
using (
  public.is_staff()
  or shipment_id in (
    select s.id
    from public.shipments s
    join public.customers c on c.id = s.customer_id
    where c.user_id = public.current_profile_id()
  )
);

create policy "operations staff can manage shipment packages"
on public.shipment_packages for all
using (public.has_role('super_admin') or public.has_role('operations') or public.has_role('warehouse'))
with check (public.has_role('super_admin') or public.has_role('operations') or public.has_role('warehouse'));

create policy "customers can read own shipment status history"
on public.shipment_status_history for select
using (
  public.is_staff()
  or shipment_id in (
    select s.id
    from public.shipments s
    join public.customers c on c.id = s.customer_id
    where c.user_id = public.current_profile_id()
  )
);

create policy "operations staff can manage shipment status history"
on public.shipment_status_history for all
using (public.has_role('super_admin') or public.has_role('operations') or public.has_role('warehouse'))
with check (public.has_role('super_admin') or public.has_role('operations') or public.has_role('warehouse'));

create policy "staff can manage warehouse receipts"
on public.warehouse_receipts for all
using (public.has_role('super_admin') or public.has_role('operations') or public.has_role('warehouse'))
with check (public.has_role('super_admin') or public.has_role('operations') or public.has_role('warehouse'));

create policy "customers can read own invoices"
on public.invoices for select
using (
  public.is_staff()
  or customer_id in (
    select id from public.customers where user_id = public.current_profile_id()
  )
);

create policy "finance staff can manage invoices"
on public.invoices for all
using (public.has_role('super_admin') or public.has_role('finance'))
with check (public.has_role('super_admin') or public.has_role('finance'));

create policy "customers can read own payments"
on public.payments for select
using (
  public.is_staff()
  or invoice_id in (
    select i.id
    from public.invoices i
    join public.customers c on c.id = i.customer_id
    where c.user_id = public.current_profile_id()
  )
);

create policy "finance staff can manage payments"
on public.payments for all
using (public.has_role('super_admin') or public.has_role('finance'))
with check (public.has_role('super_admin') or public.has_role('finance'));

create policy "finance staff can manage expenses"
on public.expenses for all
using (public.has_role('super_admin') or public.has_role('finance'))
with check (public.has_role('super_admin') or public.has_role('finance'));

create policy "staff can read expenses"
on public.expenses for select
using (public.has_role('super_admin') or public.has_role('finance'));

create policy "customers can read own support tickets"
on public.support_tickets for select
using (
  public.is_staff()
  or customer_id in (
    select id from public.customers where user_id = public.current_profile_id()
  )
);

create policy "customers can create own support tickets"
on public.support_tickets for insert
with check (
  public.is_staff()
  or customer_id in (
    select id from public.customers where user_id = public.current_profile_id()
  )
);

create policy "staff can manage support tickets"
on public.support_tickets for all
using (public.has_role('super_admin') or public.has_role('support'))
with check (public.has_role('super_admin') or public.has_role('support'));

create policy "customers can read own ticket messages"
on public.ticket_messages for select
using (
  public.is_staff()
  or ticket_id in (
    select t.id
    from public.support_tickets t
    join public.customers c on c.id = t.customer_id
    where c.user_id = public.current_profile_id()
  )
);

create policy "customers can create own ticket messages"
on public.ticket_messages for insert
with check (
  public.is_staff()
  or ticket_id in (
    select t.id
    from public.support_tickets t
    join public.customers c on c.id = t.customer_id
    where c.user_id = public.current_profile_id()
  )
);

create policy "staff can manage ticket messages"
on public.ticket_messages for all
using (public.has_role('super_admin') or public.has_role('support'))
with check (public.has_role('super_admin') or public.has_role('support'));

create policy "users can read own notifications"
on public.notifications for select
using (user_id = public.current_profile_id() or public.is_staff());

create policy "staff can manage notifications"
on public.notifications for all
using (public.is_staff())
with check (public.is_staff());

create policy "super admin can read audit logs"
on public.audit_logs for select
using (public.has_role('super_admin'));

create policy "super admin can manage audit logs"
on public.audit_logs for all
using (public.has_role('super_admin'))
with check (public.has_role('super_admin'));
