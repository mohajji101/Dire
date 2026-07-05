-- DIRE Cargo Logistics
-- Admin profile seed
--
-- Step 1:
--   Supabase Dashboard -> Authentication -> Users -> Add user
--
-- Step 2:
--   Replace BOTH placeholders below:
--   - PASTE_AUTH_USER_UID_HERE
--   - admin@direcargo.com
--
-- Step 3:
--   Run this file in SQL Editor

insert into public.users (auth_user_id, email, status, created_at)
values (
  'b5951abd-7f9e-4642-8cd7-dddc6c73b750',
  'admin@direcargo.com',
  'active',
  now()
)
on conflict (auth_user_id)
do update set
  email = excluded.email,
  status = 'active';

insert into public.user_roles (user_id, role_id)
select u.id, r.id
from public.users u
join public.roles r on r.name = 'super_admin'
where u.auth_user_id = 'PASTE_AUTH_USER_UID_HERE'
on conflict (user_id, role_id) do nothing;

select
  u.id,
  u.auth_user_id,
  u.email,
  r.name as role_name
from public.users u
left join public.user_roles ur on ur.user_id = u.id
left join public.roles r on r.id = ur.role_id
where u.auth_user_id = 'PASTE_AUTH_USER_UID_HERE';
