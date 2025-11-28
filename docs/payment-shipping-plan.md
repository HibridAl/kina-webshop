# Payment Integration & Shipping/Tax Design (T-01 / T-02)

_Last updated: 2025-11-28 (backend-alpha@agentmail)_

## 1. Current State Snapshot

- Checkout UI (`app/checkout/page.tsx`) collects shipping/billing info, computes totals via `lib/pricing.ts`, and when Stripe keys are present calls `POST /api/checkout/session` (authorized with the user’s Supabase access token) to start a Checkout Session. If Stripe isn’t configured, it falls back to the local `createOrder` helper for a mock/Supabase order.
- Webhook handler (`app/api/webhooks/stripe/route.ts`) also listens for `checkout.session.completed` events and uses `fulfillStripeOrder` in `lib/db.ts` to create `orders`, `order_items`, and `order_payments` rows.
- `order_payments` exists in `scripts/00-schema.sql`, but orders stay in `pending` forever and checkout lacks itemized shipping/tax selection.
- Shipping/tax helpers exist in `lib/pricing.ts`, but data is static/fallback-only and not persisted.

## 2. Goals for T-01 / T-02

1. **T-01 – Payment Integration (Stripe first):**
   - Cleanly separate "create checkout session" from the webhook endpoint.
   - Persist `order_payments` rows with accurate status transitions (pending → completed/refunded/failed).
   - Keep checkout/cart flows resilient when Supabase or Stripe keys are absent.

2. **T-02 – Shipping & Tax Logic:**
   - Define a first-class list of shipping methods (IDs, price, delivery windows) with database + fallback seeds.
   - Expand `lib/pricing.ts` to compute totals using these methods and VAT/tax configs per region.
   - Surface shipping selection + taxes to checkout API payloads so backend totals match the UI.

## 3. Stripe Integration Plan (covers T-01.1)

### 3.1 API & Data Flow

```
Client checkout → POST /api/checkout/session
  ↳ Validates cart (via `resolveCheckoutItems`), shipping method, totals
  ↳ Creates Stripe Checkout Session (mode=payment)
  ↳ Stores a "checkout draft" (optional) or encodes shipping/billing/user/items in metadata

Stripe ↔ Customer completes payment

Stripe → POST /api/webhooks/stripe (signature-verified)
  ↳ On `checkout.session.completed` → fetches metadata
  ↳ Calls `fulfillStripeOrder()` to create orders/order_items/order_payments
  ↳ Updates order status (`pending` → `paid` / `failed`)

Client → `/checkout?status=success` → poll order status (optional) and show confirmation
```

### 3.2 Backend Surfaces

| Component | Status | Notes |
| --- | --- | --- |
| `POST /api/checkout/session` | **New** | Dedicated endpoint for starting Stripe Checkout. Requires a Supabase Bearer token, validates cart + shipping/tax totals server-side, and returns `{ sessionId, url }`. |
| `app/api/webhooks/stripe/route.ts` | **Update** | Only handles webhook events. Verifies signature with `STRIPE_WEBHOOK_SECRET`. |
| `fulfillStripeOrder` | **Update** | Accept shipping method/tax amounts, update `orders.status` (`pending` → `paid`), and insert into `order_payments` with full metadata. |
| `lib/db.ts` | **Add** | Helper to persist `order_payments` updates (e.g., refunds, failures) for future T-05 tasks. |

### 3.3 Required Environment Variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Loads Stripe.js on the client when present. |
| `STRIPE_SECRET_KEY` | Server-side secret used in `/api/checkout/session` + webhook handler. |
| `STRIPE_WEBHOOK_SECRET` | Signature verification for incoming webhooks. |
| `NEXT_PUBLIC_SITE_URL` | Used for success/cancel URLs & canonical metadata (fallbacks already improved). |

### 3.4 Order & Payment Mapping

- `orders.status` values:
  - `pending`: order created before payment confirmation.
  - `paid`: payment succeeded.
  - `failed`: Stripe marks the session/payment intent as failed/cancelled.
  - `refunded`: placeholder for future T-05/T-28 work.
- `order_payments.status` mirrors Stripe intent status (`pending`, `completed`, `failed`, `refunded`).
- Store `transaction_id` = payment intent ID, `checkout_session_id`, `payment_method`, and `receipt_url`.
- Attach shipping/tax totals and addresses onto the `orders` row for audit.

### 3.5 Security & Resiliency

- **Webhooks**: reject if `STRIPE_WEBHOOK_SECRET` missing; log and return 500.
- **Session creation**: require authenticated user (Supabase bearer token) + non-empty cart + validated shipping method. Metadata is written server-side so webhook handlers never rely on caller-provided IDs.
- **Retry safety**: webhook handler checks for existing `order_payments.transaction_id` before creating duplicates.
- **Fallback**: when Stripe env vars missing, UI hides "Pay securely" and defaults to mock order creation (existing behavior).

## 4. Shipping & Tax Definition (covers T-02.1)

### 4.1 Shipping Method Catalog

| Code | Name | Price (USD) | Delivery Estimate | Region | Notes |
| --- | --- | --- | --- | --- | --- |
| `eu-standard` | EU Standard Parcel | 12.00 | 4–6 business days | EU | Default method for EU addresses. |
| `eu-express` | EU Express Courier | 28.00 | 1–3 business days | EU | Express option, requires phone number. |
| `intl-priority` | International Priority | 45.00 | 3–5 business days | Worldwide | Used when `country` not in EU/HU. |
| `hu-local` | Hungary Next-Day | 8.00 | 1–2 business days | HU | Cheapest tier for domestic shipments. |

Implementation notes:
- Seed these into `shipping_methods` via a migration or script.
- Keep `lib/pricing.ts` fallback list in sync for mock/offline scenarios.
- Expose helper `getDefaultShippingMethod(methods, country)` to auto-select `hu-local` if shipping country is HU, else `eu-standard`.

### 4.2 Tax/VAT Rules

- Keep `lib/pricing.ts` as the canonical calculator (already stores HU/EU/UK/US rates).
- Accept a `country` string from the checkout form; `calculateOrderTotals` uses normalized ISO codes.
- Persist the computed `tax` + `taxLabel` with the order payload so backend/order confirmation emails reflect VAT type.
- Future extension: store `tax_rate` / `tax_amount` columns in `orders` for analytics (not scoped yet).

## 5. Next Actions

1. **T-01.2 (Implementation):** Split session-creation API from the webhook, gate it on required env vars, and update `fulfillStripeOrder` to record shipping/tax metadata + status transitions.
2. **T-02.2:** Add a server helper to read/write `shipping_methods`, expose `getDefaultShippingMethod` variants, and ensure checkout UI displays `OrderSummary` totals sourced from shared helpers.
3. **Coordination:** Once backend endpoints exist, `ui-alpha` can wire shipping/tax method selection UI (T-03.1) and show payment status badges.

---

This document satisfies **T-01.1** (integration approach) and **T-02.1** (shipping/tax definition). Upcoming work for **T-01.2** and **T-02.2** will reference this plan.
