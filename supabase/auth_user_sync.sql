-- DIRE Cargo Logistics
-- Sync Supabase auth users into public.users
--
-- Run this in Supabase SQL Editor.
-- It does two things:
-- 1. Backfills existing auth users into public.users
-- 2. Automatically syncs future auth user create/update/delete events

create sequence if not exists public.customer_number_seq start 100000;

create or replace function public.ensure_customer_signup_profile(
  profile_user_id uuid,
  profile_email text,
  profile_phone text,
  metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_customer_code text;
  customer_role_id uuid;
  existing_customer_id uuid;
  customer_seed bigint;
  derived_first_name text;
begin
  if coalesce(metadata->>'auto_customer', 'false') <> 'true' then
    return;
  end if;

  claimed_customer_code := upper(nullif(trim(coalesce(metadata->>'customer_code', '')), ''));

  select id
  into customer_role_id
  from public.roles
  where name = 'customer'
  limit 1;

  if customer_role_id is not null then
    insert into public.user_roles (user_id, role_id)
    values (profile_user_id, customer_role_id)
    on conflict (user_id, role_id) do nothing;
  end if;

  select id
  into existing_customer_id
  from public.customers
  where user_id = profile_user_id
  limit 1;

  if existing_customer_id is null and claimed_customer_code is not null then
    select id
    into existing_customer_id
    from public.customers
    where customer_code = claimed_customer_code
      and (user_id is null or user_id = profile_user_id)
    limit 1;
  end if;

  if existing_customer_id is null then
    select id
    into existing_customer_id
    from public.customers
    where (user_id is null or user_id = profile_user_id)
      and (
        (profile_email is not null and lower(coalesce(email, '')) = lower(profile_email))
        or (
          coalesce(profile_phone, '') <> ''
          and regexp_replace(coalesce(phone, ''), '\s+', '', 'g') =
              regexp_replace(profile_phone, '\s+', '', 'g')
        )
      )
    order by created_at asc
    limit 1;
  end if;

  if existing_customer_id is null then
    customer_seed := nextval('public.customer_number_seq');
    derived_first_name := nullif(trim(coalesce(metadata->>'first_name', '')), '');

    if derived_first_name is null then
      derived_first_name := split_part(coalesce(profile_email, 'customer@direcargo.com'), '@', 1);
    end if;

    insert into public.customers (
      user_id,
      customer_code,
      suite_number,
      customer_type,
      first_name,
      last_name,
      company_name,
      email,
      phone,
      country,
      city,
      address,
      status,
      created_at
    )
    values (
      profile_user_id,
      'DC' || lpad(customer_seed::text, 6, '0'),
      'SU-' || lpad(customer_seed::text, 6, '0'),
      coalesce(nullif(metadata->>'customer_type', ''), 'individual'),
      derived_first_name,
      nullif(trim(coalesce(metadata->>'last_name', '')), ''),
      nullif(trim(coalesce(metadata->>'company_name', '')), ''),
      profile_email,
      coalesce(nullif(trim(coalesce(metadata->>'phone', '')), ''), profile_phone),
      nullif(trim(coalesce(metadata->>'country', '')), ''),
      nullif(trim(coalesce(metadata->>'city', '')), ''),
      nullif(trim(coalesce(metadata->>'address', '')), ''),
      'active',
      now()
    );
  else
    update public.customers
    set
      user_id = profile_user_id,
      email = coalesce(profile_email, email),
      phone = coalesce(nullif(profile_phone, ''), phone),
      first_name = coalesce(nullif(trim(coalesce(metadata->>'first_name', '')), ''), first_name),
      last_name = coalesce(nullif(trim(coalesce(metadata->>'last_name', '')), ''), last_name),
      company_name = coalesce(nullif(trim(coalesce(metadata->>'company_name', '')), ''), company_name),
      country = coalesce(nullif(trim(coalesce(metadata->>'country', '')), ''), country),
      city = coalesce(nullif(trim(coalesce(metadata->>'city', '')), ''), city),
      address = coalesce(nullif(trim(coalesce(metadata->>'address', '')), ''), address),
      customer_type = coalesce(nullif(metadata->>'customer_type', ''), customer_type),
      status = 'active'
    where id = existing_customer_id;
  end if;
end;
$$;

create or replace function public.sync_auth_user_to_profile_upsert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_user_id uuid;
begin
  insert into public.users (auth_user_id, email, phone, status, created_at)
  values (
    new.id,
    new.email,
    new.phone,
    'active',
    coalesce(new.created_at, now())
  )
  on conflict (auth_user_id)
  do update set
    email = excluded.email,
    phone = excluded.phone,
    status = 'active'
  returning id into profile_user_id;

  perform public.ensure_customer_signup_profile(
    profile_user_id,
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data, '{}'::jsonb)
  );

  return new;
end;
$$;

create or replace function public.sync_auth_user_to_profile_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_profile_id uuid;
begin
  select id
  into deleted_profile_id
  from public.users
  where auth_user_id = old.id
  limit 1;

  if deleted_profile_id is null then
    return old;
  end if;

  delete from public.customer_documents cd
  using public.customers c
  where cd.customer_id = c.id
    and c.user_id = deleted_profile_id
    and not exists (select 1 from public.shipments s where s.customer_id = c.id)
    and not exists (select 1 from public.buy_ship_requests b where b.customer_id = c.id)
    and not exists (select 1 from public.invoices i where i.customer_id = c.id)
    and not exists (select 1 from public.support_tickets t where t.customer_id = c.id)
    and not exists (select 1 from public.warehouse_receipts wr where wr.customer_id = c.id);

  delete from public.customers c
  where c.user_id = deleted_profile_id
    and not exists (select 1 from public.shipments s where s.customer_id = c.id)
    and not exists (select 1 from public.buy_ship_requests b where b.customer_id = c.id)
    and not exists (select 1 from public.invoices i where i.customer_id = c.id)
    and not exists (select 1 from public.support_tickets t where t.customer_id = c.id)
    and not exists (select 1 from public.warehouse_receipts wr where wr.customer_id = c.id);

  update public.customers
  set
    status = case
      when status = 'active' then 'suspended'
      else status
    end,
    user_id = null
  where user_id = deleted_profile_id;

  delete from public.users
  where id = deleted_profile_id;

  return old;
end;
$$;

drop trigger if exists on_auth_user_upsert on auth.users;
create trigger on_auth_user_upsert
after insert or update on auth.users
for each row execute function public.sync_auth_user_to_profile_upsert();

drop trigger if exists on_auth_user_delete on auth.users;
create trigger on_auth_user_delete
after delete on auth.users
for each row execute function public.sync_auth_user_to_profile_delete();

insert into public.users (auth_user_id, email, phone, status, created_at)
select
  au.id,
  au.email,
  au.phone,
  'active',
  coalesce(au.created_at, now())
from auth.users au
on conflict (auth_user_id)
do update set
  email = excluded.email,
  phone = excluded.phone,
  status = 'active';

delete from public.users u
where u.auth_user_id is not null
  and not exists (
    select 1
    from auth.users au
    where au.id = u.auth_user_id
  );

do $$
declare
  row record;
begin
  for row in
    select
      u.id,
      u.email,
      u.phone,
      au.raw_user_meta_data
    from public.users u
    join auth.users au on au.id = u.auth_user_id
    where coalesce(au.raw_user_meta_data->>'auto_customer', 'false') = 'true'
  loop
    perform public.ensure_customer_signup_profile(
      row.id,
      row.email,
      row.phone,
      coalesce(row.raw_user_meta_data, '{}'::jsonb)
    );
  end loop;
end;
$$;

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

select id, auth_user_id, email, status, created_at
from public.users
order by created_at desc, email asc;
