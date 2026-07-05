-- DIRE Cargo Logistics
-- Pricing charge types and expanded invoice line items

alter table public.pricing_rules
  add column if not exists charge_type text not null default 'freight';

update public.pricing_rules
set charge_type = 'freight'
where charge_type is null or trim(charge_type) = '';

alter table public.invoices
  add column if not exists handling_fee numeric not null default 0,
  add column if not exists customs_fee numeric not null default 0,
  add column if not exists delivery_fee numeric not null default 0,
  add column if not exists customs_fee_mode text not null default 'included_in_invoice',
  add column if not exists minimum_charge_applied boolean not null default false;
