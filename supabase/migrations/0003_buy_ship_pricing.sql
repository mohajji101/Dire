alter table public.buy_ship_requests
  add column if not exists currency text not null default 'USD',
  add column if not exists pricing_basis text not null default 'fixed_total',
  add column if not exists unit_price numeric;

update public.buy_ship_requests
set currency = coalesce(currency, 'USD'),
    pricing_basis = coalesce(pricing_basis, 'fixed_total')
where currency is null
   or pricing_basis is null;
