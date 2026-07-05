-- DIRE Cargo Logistics
-- Sample pricing rules
-- Run after 0007_pricing_and_invoice_charges.sql

insert into public.pricing_rules (shipment_type, charge_type, minimum_value, maximum_value, price, currency)
values
  ('AIR', 'freight', 0, 999999, 4.5, 'USD'),
  ('AIR', 'minimum_charge', 0, null, 25, 'USD'),
  ('AIR', 'handling_fee', 0, null, 5, 'USD'),
  ('AIR', 'customs_fee', 0, null, 0, 'USD'),
  ('AIR', 'delivery_fee', 0, null, 10, 'USD'),
  ('SEA', 'freight', 0, 999999, 85, 'USD'),
  ('SEA', 'minimum_charge', 0, null, 40, 'USD'),
  ('SEA', 'handling_fee', 0, null, 8, 'USD'),
  ('SEA', 'customs_fee', 0, null, 0, 'USD'),
  ('SEA', 'delivery_fee', 0, null, 12, 'USD')
on conflict do nothing;
