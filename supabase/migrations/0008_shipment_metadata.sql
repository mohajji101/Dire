-- DIRE Cargo Logistics
-- Shipment metadata for clearer cargo registration

alter table public.shipments
  add column if not exists commodity text,
  add column if not exists description text,
  add column if not exists package_count integer not null default 1;
