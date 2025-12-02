# Order Status Model & Transitions

_Scope_: Roadmap T-05.1 (bead `my-new-esa.1`)

This note defines the canonical order lifecycle for AutoHub so backend helpers, APIs, and the upcoming admin UI all speak the same language. It covers the statuses recorded in the `orders` table, how they relate to `order_payments`, and which transitions are allowed by automation vs. admin actions.

## 1. Status Glossary

| Status | Purpose | Typical Entry | Who Sets It |
| --- | --- | --- | --- |
| `pending` | Order created but payment not yet confirmed. | Checkout session created (guest or authenticated) or mock checkout path. | Checkout flow / Stripe webhook. |
| `paid` | Payment succeeded and funds captured. | Stripe webhook after `checkout.session.completed` with `payment_status=paid`. | Stripe webhook / backend automation. |
| `processing` | Warehouse/picking in progress. | Admin or fulfillment worker starts packing after confirming inventory. | Admin UI / automation. |
| `shipped` | Order handed to carrier with tracking. | Admin UI records shipment + tracking. | Admin UI / automation. |
| `cancelled` | Order voided before shipment (failed payment, customer cancellation, stock issue). | Explicit admin action or Stripe failure/refund before fulfillment. | Backend automation (payment failure) or admin. |
| `refunded` | Funds returned after shipment (partial or full). | Admin initiates refund + RMA workflow (ties into T-28). | Admin UI + backend refund helper. |

> NOTE: `delivered` can be introduced later (T-05 follow-ons) but is omitted for now so the state machine stays focused on actionable fulfillment steps.

## 2. Transition Rules

| From | To | Trigger | Notes |
| --- | --- | --- | --- |
| `pending` | `paid` | Stripe payment succeeds (webhook) OR manual payment capture for offline orders. | No human intervention; `order_payments.status` must move to `completed` at the same time. |
| `pending` | `cancelled` | Payment fails, user aborts checkout, or admin voids cart. | Only allowed if nothing has been shipped yet. |
| `paid` | `processing` | Fulfillment team starts work. | Admin-only; ensures inventory is reserved. |
| `processing` | `shipped` | Parcel leaves warehouse. | Admin-only; requires tracking metadata. |
| `paid`/`processing`/`shipped` | `cancelled` | Admin cancels (e.g., OOS) before shipment; shipping reversal if carriers support it. | `shipped → cancelled` should be rare and may require refund. |
| `paid`/`processing`/`shipped` | `refunded` | Partial or full refund issued post-charge. | Always paired with an `order_payments` entry showing `status='refunded'` and an amount. |

### ASCII State Diagram

```text
[pending]
   |  (Stripe success)
   v
[paid] --(fulfillment start)--> [processing] --(carrier pickup)--> [shipped]
   |                                |                                  \
   | (admin cancel/refund)          | (admin cancel)                    | (RMA)
   v                                v                                  v
[cancelled] <-------------------- [refunded] <------------------------/
```

* Solid arrows show the happy path. The branches to `cancelled`/`refunded` represent exception handling driven by automation or admins.

## 3. Payment Alignment

- `order_payments.status` mirrors provider state (`pending`, `completed`, `failed`, `refunded`).
- Rules of thumb:
  - `orders.status = paid` **must** correspond to at least one `order_payments` row with `status='completed'`.
  - When issuing a refund, record a new `order_payments` row (or update an existing one) with `status='refunded'` and link it to the `refunded` order state transition for auditability.
  - Failed or expired Stripe sessions should never advance past `pending`; the webhook should either leave the order untouched or flip it to `cancelled`.

## 4. Enforcement Checklist for T-05

1. **Helpers (`lib/db.ts`)**: add `updateOrderStatus(orderId, newStatus, meta)` that validates transitions against the table above and logs attempts to skip steps.
2. **API (`/app/api/orders/[id]/status`)**: accepts the desired status, calls the helper, and enforces role-based permissions (admins only for anything beyond `pending → cancelled`).
3. **Admin UI**: expose dropdowns/buttons that map directly to the allowed transitions to prevent invalid combinations.
4. **Auditing**: every transition should record `updated_by`, timestamp, and optional note (structured logging or future audit table).

Keeping this document up to date ensures later tasks (T-05.2–T-05.4, T-06.*, T-28) share a single source of truth.
