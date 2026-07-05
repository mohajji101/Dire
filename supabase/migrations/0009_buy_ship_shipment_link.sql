-- DIRE Cargo Logistics
-- Link Buy & Ship requests to converted shipments

alter table public.buy_ship_requests
  add column if not exists shipment_id uuid references public.shipments(id) on delete set null;

create index if not exists idx_buy_ship_requests_shipment_id
  on public.buy_ship_requests(shipment_id);
