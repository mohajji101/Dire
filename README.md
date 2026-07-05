# Dire Cargo Logistics System

Enterprise logistics control center built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Local Development

```powershell
npm.cmd install
npm.cmd run dev
```

Open:

```text
http://127.0.0.1:3000
```

The root route redirects to `/login`.

## Demo Mode

If Supabase environment variables are not set, login runs in demo mode:

- Email/phone: `admin@direcargo.com`
- Password: ``

Submitting the login form redirects to `/operations?mode=demo`.

## Supabase Mode

Copy `.env.example` to `.env.local` and fill:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

When Supabase env vars exist:

- Login uses Supabase Auth.
- Middleware protects app routes.
- `/api/v1/auth/me` returns the active Supabase user.
- Full admin write workflows require `SUPABASE_SERVICE_ROLE_KEY`.

## Verification

```powershell
npm.cmd run lint
npm.cmd run build
```

## Project Docs

- `docs/DIRE_CARGO_IMPLEMENTATION.md`
- `docs/DATABASE_SCHEMA.md`
- `docs/API_SPEC.md`
- `docs/SUPABASE_SETUP.md`
- `docs/FINAL_QA_DEPLOYMENT_CHECKLIST.md`
- `docs/DEPLOYMENT_HANDOFF.md`
- `supabase/schema_setup.sql`
- `supabase/rls_setup.sql`
- `supabase/auth_user_sync.sql`
# Dire
