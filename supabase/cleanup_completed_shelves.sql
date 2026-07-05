-- DIRE Cargo Logistics
-- Clear old shelf assignments left behind by already-completed shipments
-- Safe to run multiple times.

update public.shipment_packages sp
set warehouse_shelf_id = null
from public.shipments s
where s.id = sp.shipment_id
  and s.status = 'delivered'
  and sp.warehouse_shelf_id is not null;
