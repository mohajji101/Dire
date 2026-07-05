# Supabase Setup

The app is now connected to Supabase through `.env.local`.

## Current Status

- Supabase URL is configured.
- Supabase anon key is configured.
- Service role key is required for full write access across admin workflows.
- Main database tables are reachable.
- Protected routes redirect to `/login` when there is no active session.

Use this in `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Customer Self Signup

Customer self-signup now requires the updated auth sync provisioning SQL.

Run:

`supabase/auth_user_sync.sql`

again in Supabase SQL Editor after pulling the latest code.

That script now:

- syncs `auth.users` into `public.users`
- auto-assigns role `customer` for users created from the signup page
- auto-creates a `public.customers` record for those signup users
- links signup users to an existing `public.customers` record when they provide a valid `customer_code`

When `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`, the signup page creates
customer auth users as confirmed accounts immediately, so they can log in without
waiting for email confirmation.

After that, customer signup is available at:

```text
http://127.0.0.1:3000/signup
```

## Next Required Step: Create First Admin User

Create a user in Supabase Auth:

1. Open Supabase dashboard.
2. Go to `Authentication` -> `Users`.
3. Click `Add user`.
4. Use an email and password you want for the first admin/operator login.
5. Copy the new user's `User UID`.

Then open:

`supabase/seed_admin_profile.sql`

Replace:

- `PASTE_AUTH_USER_UID_HERE`
- `admin@direcargo.com`

Run the SQL in Supabase SQL Editor.

After that, log in at:

```text
http://127.0.0.1:3000/login
```

## Why This Is Needed

Supabase Auth stores the login account. The app database stores:

- `users` profile row
- role assignment
- app permissions and module access

Both sides need to be linked through `users.auth_user_id`.
