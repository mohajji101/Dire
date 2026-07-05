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
