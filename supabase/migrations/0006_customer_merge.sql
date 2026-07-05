-- DIRE Cargo Logistics
-- Atomic customer merge function

create or replace function public.merge_customers(
  source_customer_id uuid,
  target_customer_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  source_customer public.customers%rowtype;
  target_customer public.customers%rowtype;
  merged_address text;
  merged_city text;
  merged_company_name text;
  merged_country text;
  merged_customer_type text;
  merged_email text;
  merged_first_name text;
  merged_last_name text;
  merged_phone text;
  merged_status text;
  merged_suite_number text;
  merged_user_id uuid;
  moved_shipments integer := 0;
  moved_buy_ship_requests integer := 0;
  moved_invoices integer := 0;
  moved_support_tickets integer := 0;
  moved_warehouse_receipts integer := 0;
  moved_customer_documents integer := 0;
begin
  if source_customer_id is null or target_customer_id is null then
    raise exception 'Source and target customer are required.';
  end if;

  if source_customer_id = target_customer_id then
    raise exception 'Source and target customer cannot be the same.';
  end if;

  select *
  into source_customer
  from public.customers
  where id = source_customer_id
  for update;

  select *
  into target_customer
  from public.customers
  where id = target_customer_id
  for update;

  if source_customer.id is null or target_customer.id is null then
    raise exception 'Source or target customer was not found.';
  end if;

  if source_customer.user_id is not null
    and target_customer.user_id is not null
    and source_customer.user_id <> target_customer.user_id then
    raise exception 'Both customer records already have different linked portal users. Unlink one record first.';
  end if;

  merged_address := coalesce(nullif(trim(target_customer.address), ''), nullif(trim(source_customer.address), ''));
  merged_city := coalesce(nullif(trim(target_customer.city), ''), nullif(trim(source_customer.city), ''));
  merged_company_name := coalesce(nullif(trim(target_customer.company_name), ''), nullif(trim(source_customer.company_name), ''));
  merged_country := coalesce(nullif(trim(target_customer.country), ''), nullif(trim(source_customer.country), ''));
  merged_customer_type := coalesce(nullif(trim(target_customer.customer_type), ''), nullif(trim(source_customer.customer_type), ''));
  merged_email := coalesce(nullif(trim(target_customer.email), ''), nullif(trim(source_customer.email), ''));
  merged_first_name := coalesce(nullif(trim(target_customer.first_name), ''), nullif(trim(source_customer.first_name), ''));
  merged_last_name := coalesce(nullif(trim(target_customer.last_name), ''), nullif(trim(source_customer.last_name), ''));
  merged_phone := coalesce(nullif(trim(target_customer.phone), ''), nullif(trim(source_customer.phone), ''));
  merged_status := case
    when target_customer.status = 'active' or source_customer.status = 'active' then 'active'
    else target_customer.status
  end;
  merged_suite_number := coalesce(nullif(trim(target_customer.suite_number), ''), nullif(trim(source_customer.suite_number), ''));
  merged_user_id := coalesce(target_customer.user_id, source_customer.user_id);

  update public.customers
  set
    address = merged_address,
    city = merged_city,
    company_name = merged_company_name,
    country = merged_country,
    customer_type = merged_customer_type,
    email = merged_email,
    first_name = merged_first_name,
    last_name = merged_last_name,
    phone = merged_phone,
    status = merged_status,
    suite_number = merged_suite_number,
    user_id = merged_user_id
  where id = target_customer_id;

  update public.shipments
  set customer_id = target_customer_id
  where customer_id = source_customer_id;
  get diagnostics moved_shipments = row_count;

  update public.buy_ship_requests
  set customer_id = target_customer_id
  where customer_id = source_customer_id;
  get diagnostics moved_buy_ship_requests = row_count;

  update public.invoices
  set customer_id = target_customer_id
  where customer_id = source_customer_id;
  get diagnostics moved_invoices = row_count;

  update public.support_tickets
  set customer_id = target_customer_id
  where customer_id = source_customer_id;
  get diagnostics moved_support_tickets = row_count;

  update public.warehouse_receipts
  set customer_id = target_customer_id
  where customer_id = source_customer_id;
  get diagnostics moved_warehouse_receipts = row_count;

  update public.customer_documents
  set customer_id = target_customer_id
  where customer_id = source_customer_id;
  get diagnostics moved_customer_documents = row_count;

  delete from public.customers
  where id = source_customer_id;

  return jsonb_build_object(
    'sourceCustomerId', source_customer.id,
    'sourceCustomerCode', source_customer.customer_code,
    'targetCustomerId', target_customer.id,
    'targetCustomerCode', target_customer.customer_code,
    'targetUserLinked', merged_user_id is not null,
    'movedCounts', jsonb_build_object(
      'shipments', moved_shipments,
      'buy_ship_requests', moved_buy_ship_requests,
      'invoices', moved_invoices,
      'support_tickets', moved_support_tickets,
      'warehouse_receipts', moved_warehouse_receipts,
      'customer_documents', moved_customer_documents
    )
  );
end;
$$;
