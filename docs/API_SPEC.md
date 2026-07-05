# Dire Cargo - API Specification Draft

Base URL:

```text
/api/v1
```

Backend implementation:

- Next.js route handlers.
- Supabase client/server SDK.
- Zod request validation.
- Server-side role checks.
- Supabase RLS as the final data access boundary.

## Response Shape

Success:

```json
{
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Auth APIs

### `POST /auth/login`

Login with email/phone and password.

Body:

- `identifier`
- `password`

### `POST /auth/register`

Register a customer account.

Body:

- `name`
- `phone`
- `email`
- `password`
- `customerType`

### `POST /auth/logout`

End current session.

### `POST /auth/otp/verify`

Verify OTP login or sensitive action.

Body:

- `identifier`
- `otp`

### `GET /auth/me`

Return current user, roles, permissions, customer profile if linked.

## Customer APIs

### `GET /customers`

Admin/staff customer list.

Query:

- `search`
- `type`
- `status`
- `page`
- `pageSize`

### `POST /customers`

Create customer.

### `GET /customers/:id`

Customer profile detail.

### `PUT /customers/:id`

Update customer profile.

### `DELETE /customers/:id`

Soft delete or deactivate customer.

## Shipment APIs

### `GET /shipments`

Shipment list.

Query:

- `status`
- `type`
- `dateFrom`
- `dateTo`
- `customerId`
- `search`

Columns needed by UI:

- tracking number
- customer
- status
- weight/CBM
- location
- expected arrival

### `POST /shipments`

Create shipment.

Body:

- `customerId`
- `shipmentType`
- `originCountry`
- `destinationCountry`
- `expectedArrival`
- `packages`

Packages:

- `weight`
- `length`
- `width`
- `height`
- `volume`
- `declaredValue`

### `GET /shipments/:id`

Shipment details.

Includes:

- package info
- photos
- status history
- invoice link
- warehouse info
- customs clearance

### `PUT /shipments/:id`

Update shipment metadata.

### `DELETE /shipments/:id`

Cancel/archive shipment.

### `GET /shipments/track/:trackingNumber`

Public/customer tracking lookup.

### `POST /shipments/:id/status`

Update shipment status and append `shipment_status_history`.

Body:

- `status`
- `notes`

Realtime event:

- `shipment_status_changed`

## Warehouse APIs

### `GET /warehouse/packages`

List warehouse packages.

Query:

- `warehouseId`
- `zone`
- `shelf`
- `status`
- `search`

### `POST /warehouse/receive`

Receive a package into warehouse.

Body:

- `customerCode`
- `shipmentId`
- `warehouseId`
- `weight`
- `photoUrl`

Realtime event:

- `package_received`

### `POST /warehouse/assign-shelf`

Assign shelf to package.

Body:

- `packageId`
- `shelfId`

Realtime event:

- `warehouse_updated`

### `GET /warehouse/zones`

Return zone and shelf map for warehouse UI.

## Buy And Ship APIs

### `GET /buy-ship`

List Buy & Ship requests.

Query:

- `customerId`
- `status`
- `search`

### `POST /buy-ship`

Create Buy & Ship request.

Body:

- `productName`
- `purchaseLink`
- `quantity`
- `estimatedPrice`

### `GET /buy-ship/:id`

Request detail.

Includes:

- product link
- supplier info if available
- status flow
- payment status

### `PUT /buy-ship/:id`

Update request status/details.

## Finance APIs

### `GET /invoices`

List invoices.

Query:

- `customerId`
- `status`
- `currency`
- `dateFrom`
- `dateTo`

### `POST /invoices`

Create invoice.

### `GET /invoices/:id`

Invoice detail.

Includes:

- charges breakdown
- payment history
- linked shipment/order
- PDF file URL if generated

### `POST /payments`

Record payment.

Body:

- `invoiceId`
- `paymentMethod`
- `amount`
- `currency`
- `referenceNumber`
- `paymentDate`

Realtime event:

- `invoice_paid`

### `GET /payments`

Payment list/reconciliation view.

## Reports APIs

### `GET /reports/revenue`

Revenue report.

Query:

- `dateFrom`
- `dateTo`
- `currency`

### `GET /reports/shipments`

Shipment volume and status report.

### `GET /reports/customers`

Customer report and top customers.

### `GET /reports/warehouse`

Warehouse usage and efficiency report.

## Support APIs

### `GET /support/tickets`

Ticket list.

Query:

- `status`
- `priority`
- `customerId`

### `POST /support/tickets`

Create ticket.

Realtime event:

- `new_support_ticket`

### `GET /support/tickets/:id`

Ticket detail with messages.

### `POST /support/tickets/:id/messages`

Add message to ticket thread.

### `PUT /support/tickets/:id`

Update ticket status/priority.

## Notification APIs

### `GET /notifications`

Current user notifications.

### `POST /notifications/send`

Staff/system notification send.

### `PUT /notifications/:id/read`

Mark notification read.

## Security Rules

- Customer role can only access own data.
- Staff role can access assigned modules only.
- Super Admin can access all data.
- Every API must validate input before touching Supabase.
- Every mutation that changes business state should write an audit log.
