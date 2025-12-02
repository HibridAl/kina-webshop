# Checkout QA – Registered User (T-03.2a)

_Date_: 2025-12-02  
_Author_: backend-alpha (FuchsiaLake)

## Environment

- Supabase: requires populated `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and a seeded catalog/cart per README instructions.
- Stripe: configure `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and run the webhook forwarder (`stripe listen -f http://localhost:3000/api/webhooks/stripe`).
- Test account: `tester@example.com` (created via Supabase auth) with at least one item in the cart.

## Run 1 – Successful Checkout

1. Sign in as the test user in the browser; verify `/cart` shows seeded items.
2. Start dev server (`npm run dev`) and open `/checkout`.
3. Complete shipping/method steps; choose Stripe payment.
4. When the Stripe Checkout page appears, use card `4242 4242 4242 4242`, future expiry, any CVC.
5. After redirect back to `/checkout?status=success`, confirm:
   - Cart cleared client-side.
   - `/orders/<id>/confirmation` loads order + items from Supabase.
   - Supabase tables show records:
     - `orders`: new row with `user_id = tester`, `status = paid`, totals matching the UI.
     - `order_items`: line items referencing the order.
     - `order_payments`: `status = completed`, `provider = stripe`, `transaction_id = <intent>`.
6. Webhook logs include `checkout.session.completed` and `fulfillStripeOrder` success.

## Run 2 – Declined Card

1. Repeat steps 1–3.
2. In Stripe Checkout use card `4000 0000 0000 9995` (always fails).
3. Expected behavior:
   - Stripe UI reports the decline and stays on the hosted page.
   - Returning manually to `/checkout?status=cancelled` shows the warning banner.
   - No new `orders` / `order_payments` rows are inserted; cart remains intact.

## Notes & Follow-ups

- Ensure the webhook secret is kept in sync; mismatched signatures will prevent the `orders` entries from being created. Watch server logs for `[AutoHub] Stripe order missing` warnings.
- When testing declines, keep Stripe’s session tab open—closing it can leave the checkout stuck in `pending` unless the user retries.
- Screenshots + DB snapshots should accompany this doc in the shared drive (not included here due to repo size constraints).
