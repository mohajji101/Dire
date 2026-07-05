# DIRE Cargo Deployment Handoff

## 1. Runtime Requirements

- Node.js 20+
- Supabase project ready
- Environment variables configured

Required `.env.local` values:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` is required for full admin write workflows such as:

- customer writes
- shipment writes
- warehouse receive / shelf / release writes
- buy & ship writes
- invoice / payment / expense writes
- settings admin writes
- notification sends

## 2. Supabase SQL Run Order

Run these in Supabase SQL Editor in this order:

1. `supabase/schema_setup.sql`
2. `supabase/rls_setup.sql`
3. `supabase/auth_user_sync.sql`

Then:

4. `supabase/seed_admin_profile.sql`

Use `seed_admin_profile.sql` only after creating the first auth user in Supabase Auth.

## 3. What `auth_user_sync.sql` Must Provide

After running `supabase/auth_user_sync.sql`, confirm these are working:

- `auth.users` syncs into `public.users`
- signup auto-creates `public.customers`
- signup auto-assigns `customer` role
- deleting auth users removes or unlinks app-side records safely
- `public.merge_customers(source_customer_id, target_customer_id)` exists

If customer merge says function not found, rerun:

- `supabase/auth_user_sync.sql`

## 4. First Admin Setup

1. Create a user in Supabase Auth.
2. Open `supabase/seed_admin_profile.sql`
3. Replace:
   - `PASTE_AUTH_USER_UID_HERE`
   - `admin@direcargo.com`
4. Run the SQL.
5. Log in through `/login`.

## 5. Required Seed Data Before Go-Live

Create these in Settings or directly in Supabase:

### Branches

- Muqdisho HQ
- China Office
- China Warehouse

### Warehouses

At minimum:

- China Warehouse
- Muqdisho HQ warehouse record if final receiving uses warehouse flow

### Warehouse Structure

- warehouse zones
- warehouse shelves

### Currencies

At minimum:

- USD
- CNY
- any additional live currencies you plan to invoice or quote with

### Exchange Rates

Add exchange rates for all non-USD currencies used in:

- invoices
- buy & ship
- expenses
- pricing rules

## 6. Local Verification Before Deployment

Run:

```powershell
npm.cmd install
npm.cmd run lint
npm.cmd run build
```

If dev smoke test is needed:

```powershell
npm.cmd run dev
```

Open:

```text
http://127.0.0.1:3000/login
```

## 7. Live Smoke Test Order

Use this order after environment + SQL are complete:

1. Login as `super_admin`
2. Check Settings:
   - branches
   - currencies
   - exchange rates
   - roles
   - users
3. Create or verify one customer
4. Create one shipment
5. Receive package in warehouse
6. Assign shelf
7. Release package
8. Create one Buy & Ship request
9. Move it through status flow
10. Create one invoice
11. Record one payment
12. Save one expense
13. Open one support ticket and reply
14. Send one notification
15. Export reports

## 8. Workflow Rules to Remember

### Shipments

Allowed order:

- `pending`
- `in_warehouse`
- `in_transit`
- `customs_clearance`
- `ready_for_pickup`
- `delivered`

Completed shipments should not be edited again.

### Buy & Ship

Allowed order:

- `requested`
- `quoted`
- `awaiting_payment`
- `purchased`
- `in_warehouse`
- `converted_to_shipment`

Converted requests should continue from Shipments and Warehouse.

### Support

Allowed order:

- `open`
- `waiting_customer`
- `resolved`
- `closed`

Only support/admin should update ticket workflow status.

## 9. Finance Behavior

Finance totals and graphs now use `USD equivalent` for mixed currencies.

That affects:

- finance dashboard totals
- monthly revenue vs expenses
- reports revenue and overdue summaries

This depends on exchange rates being present for non-USD currencies.

## 10. Known Operational Expectations

- customer users should be created through signup or synced auth provisioning
- deleting users directly in Supabase Auth should be followed by sync validation
- warehouse flows require live branch / warehouse / zone / shelf records
- notifications page send action should be available only to non-customer staff roles
- customer pages should not expose admin workflow actions

## 11. Final Acceptance Reference

Use:

- `docs/FINAL_QA_DEPLOYMENT_CHECKLIST.md`

That file is the final go-live checklist.

