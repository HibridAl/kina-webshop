# Checkout Mock Mode QA – 2025-12-02

_Bead: my-new-61w.2 (T-03.2b)_  
_Author: backend-alpha (FuchsiaLake)_

## Environment

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` unset → `supabaseConfigured = false` across hooks/UI.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` unset → Stripe button hidden; only the mock checkout path is shown.
- Browser storage cleared before each scenario to mimic a first-time visitor.

## Flow Coverage

| Stage | Result | Notes |
| --- | --- | --- |
| Cart (anonymous) | ✅ | `useCart` falls back to `localStorage` (`autohub-cart`). Items persist across reloads within the same browser. No remote sync is attempted. |
| Cart → Checkout entry | ✅ | Visiting `/checkout` with items shows the sign-in prompt; “Continue as guest” switches the wizard to the shipping form without requiring Supabase auth. |
| Shipping step | ✅ | Form validation still enforced (email, address, etc.). Guest email/phone captured for the order receipt payload. |
| Method step | ✅ | Shipping methods supplied by `FALLBACK_SHIPPING_METHODS`; selection updates totals. |
| Payment step (mock) | ✅ | Only the “Place order” mock button appears. Clicking it stores an order receipt via `storeOrderReceipt`, clears the local cart, and routes to `/orders/ORD-<timestamp>/confirmation`. |
| Stripe button | ⛔️ | Hidden because Stripe env vars are missing (expected in mock mode). |
| Confirmation page | ⚠️ | `/orders/<id>/confirmation` pulls from sessionStorage only. Refreshing the confirmation tab (or opening the link in a new tab) shows “Unable to load this order” because there is no Supabase data. |
| `/orders/<id>` detail page | ⚠️ | Always renders the “Order not found” state in mock mode because `getOrderById` short-circuits when Supabase isn’t configured. |
| `/account/orders` | ⚠️ | Empty list + “Sign in” prompt unless Supabase is enabled. Mock orders can’t surface here. |
| Email receipts | ❌ | No email provider hooked up → the confirmation message incorrectly claims an email was sent. Needs copy guard when `supabaseConfigured === false`. |

## Limitations & Follow-ups

1. **Persistence scope** – Mock orders live only in sessionStorage. Closing the confirmation tab or visiting from another device loses the receipt entirely. Consider showing an explicit “mock/preview mode” banner and updating the confirmation copy to avoid promising emails/tracking.
2. **Account surfaces** – `/account`, `/orders/[id]`, and admin dashboards can’t display mock orders. Document this for demo environments so stakeholders understand that order history is disabled.
3. **Guest data reuse** – Shipping/billing data is stored in the receipt object but never rehydrated for the next checkout attempt. Optional enhancement: seed the shipping form with the previous submission when Supabase is disabled.
4. **Testing hooks** – Running `npm run dev` with `SUPABASE_*` unset is the canonical way to exercise mock mode. Ensure contributors understand they must clear sessionStorage between runs to avoid stale receipts.

No blocking defects surfaced—the mock path completes and shows the confirmation screen—but stakeholders should be aware of the persistence & copy caveats above.
