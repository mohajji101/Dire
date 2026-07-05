-- DIRE Cargo Logistics
-- Migration: sync auth.users into public.users

create or replace function public.sync_auth_user_to_profile_upsert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
    status = 'active';

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
