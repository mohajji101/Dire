# DIRE Cargo Final QA and Deployment Checklist

## 1. Environment

- [ ] `.env.local` contains:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Supabase schema has been applied:
  - [ ] `supabase/schema_setup.sql`
  - [ ] `supabase/rls_setup.sql`
  - [ ] `supabase/auth_user_sync.sql`
- [ ] If customer merge is needed in production, `public.merge_customers(...)` exists.
- [ ] Required branches exist in Settings:
  - [ ] `Muqdisho HQ`
  - [ ] `China Office`
  - [ ] `China Warehouse`
- [ ] At least one warehouse exists and has zones/shelves.
- [ ] Required currencies exist in Settings.
- [ ] Exchange rates are entered for non-USD currencies.

## 2. Authentication and Access

- [ ] `super_admin` can log in.
- [ ] `customer` can sign up and log in without manual role assignment.
- [ ] `customer` account creates:
  - [ ] `auth.users` record
  - [ ] `public.users` record
  - [ ] `public.user_roles` customer role
  - [ ] `public.customers` record
- [ ] Logout works from all protected screens.
- [ ] Logged-in users are redirected away from `/login` and `/signup`.
- [ ] Password show/hide works on login.
- [ ] Password change works from profile.

## 3. Customer Management

- [ ] Admin can create customer.
- [ ] Non-individual customer requires company/organization name.
- [ ] Customer profile data shows in:
  - [ ] `public.customers`
  - [ ] Customers page
  - [ ] User profile page
- [ ] Customer role/status updates work.
- [ ] Merge customer flow works.
- [ ] Merge audit appears in Settings audit logs.

## 4. Shipments

- [ ] Admin/operations can create shipment.
- [ ] Tracking number is unique.
- [ ] Shipment packages save correctly.
- [ ] Shipment detail page loads.
- [ ] Status update follows strict sequence:
  - [ ] `pending`
  - [ ] `in_warehouse`
  - [ ] `in_transit`
  - [ ] `customs_clearance`
  - [ ] `ready_for_pickup`
  - [ ] `delivered`
- [ ] Completed shipments cannot be edited again.
- [ ] Customer cannot see create shipment action.
- [ ] Customer can still track own shipments.

## 5. Warehouse

- [ ] Receive Package modal opens.
- [ ] Source branch list appears.
- [ ] Receiving warehouse list appears.
- [ ] Shipment and Buy & Ship items both appear when eligible.
- [ ] Receive package saves successfully.
- [ ] Package appears in Receiving Queue.
- [ ] Shelf assignment only allows shelves from the correct warehouse.
- [ ] Occupied shelf cannot be reused.
- [ ] Assigned shelf appears in Storage Map and Package Inventory.
- [ ] China warehouse stored package can be released to transit.
- [ ] Muqdisho HQ stored package can be released for final handoff.
- [ ] Recent Warehouse Activity shows:
  - [ ] receive event
  - [ ] shelf assignment event
  - [ ] release event

## 6. Buy & Ship

- [ ] New request button works.
- [ ] Customer can create own Buy & Ship request only.
- [ ] Admin/operations can create for any customer.
- [ ] Pricing basis works:
  - [ ] `fixed_total`
  - [ ] `per_item`
- [ ] Estimate recalculates correctly.
- [ ] Currency list comes from Settings.
- [ ] Status update follows strict sequence:
  - [ ] `requested`
  - [ ] `quoted`
  - [ ] `awaiting_payment`
  - [ ] `purchased`
  - [ ] `in_warehouse`
  - [ ] `converted_to_shipment`
- [ ] Converted request becomes locked in Buy & Ship.
- [ ] Request number remains stable across refreshes.

## 7. Invoices and Payments

- [ ] Only `super_admin` or `finance` can create invoice.
- [ ] Invoice number is unique.
- [ ] Invoice currency list comes from Settings.
- [ ] Invoice appears in invoice list and detail page.
- [ ] Record Payment works.
- [ ] Payment cannot exceed remaining balance.
- [ ] Already-paid invoice cannot receive extra payment.
- [ ] Invoice status updates correctly after payment:
  - [ ] partial payment -> `pending`
  - [ ] full payment -> `paid`
- [ ] Payment reference number is saved and visible.
- [ ] Invoice PDF opens.

## 8. Finance

- [ ] New Expense works.
- [ ] Expense currency list comes from Settings.
- [ ] Finance dashboard updates from live data.
- [ ] Revenue, outstanding, profit, and graph show `USD equivalent` totals.
- [ ] Recent payments list updates.
- [ ] Recent expenses list updates.

## 9. Support

- [ ] Customer/support can open ticket.
- [ ] Thread messages save.
- [ ] Reply works.
- [ ] Status updates work:
  - [ ] `open`
  - [ ] `waiting_customer`
  - [ ] `resolved`
  - [ ] `closed`
- [ ] Closed ticket becomes locked.

## 10. Settings

- [ ] Branch create/edit/delete works.
- [ ] Warehouse-dependent branch delete is blocked.
- [ ] Currency create/edit/delete works.
- [ ] Exchange rate create/edit works.
- [ ] Pricing rule create/edit/delete works.
- [ ] User roles update works.
- [ ] User delete works with protections:
  - [ ] cannot delete self
  - [ ] cannot delete last super admin
- [ ] Audit log records major admin actions.

## 11. Notifications, Reports, Dashboard

- [ ] Notifications page loads live records.
- [ ] Reports page loads live metrics.
- [ ] Export report works.
- [ ] Dashboard loads without stale demo blockers.

## 12. Final Technical Verification

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] App starts cleanly in dev mode.
- [ ] No blocking console errors on core workflows.
- [ ] No duplicate-key warnings on major pages.
- [ ] Supabase RLS errors no longer appear in tested flows.

## 13. Pre-Deployment Signoff

- [ ] Test with `super_admin`
- [ ] Test with `finance`
- [ ] Test with `operations`
- [ ] Test with `warehouse`
- [ ] Test with `support`
- [ ] Test with `customer`
- [ ] Confirm production branch/warehouse/currency seed data
- [ ] Confirm backup/export of production database before go-live

