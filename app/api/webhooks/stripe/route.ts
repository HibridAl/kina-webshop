import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { fulfillStripeOrder, resolveCheckoutItems, type CheckoutLineItemInput } from '@/lib/db';
import { stripeClient, stripeWebhookSecret } from '@/lib/stripe';

function safeJsonParse<T>(value?: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Failed to parse Stripe metadata JSON:', error);
    return null;
  }
}

function normalizeItems(raw?: unknown): CheckoutLineItemInput[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .filter((item) => typeof item?.productId === 'string')
      .map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity) || 1,
      }));
  }
  if (typeof raw === 'string') {
    return normalizeItems(safeJsonParse(raw));
  }
  return [];
}

export async function POST(request: NextRequest) {
  if (!stripeClient) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 500 });
  }

  if (!stripeWebhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook secret missing.' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = stripeClient.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret);
  } catch (error) {
    console.error('Stripe webhook verification failed:', error);
    return NextResponse.json({ error: 'Signature verification failed.' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === 'paid') {
      const metadata = session.metadata ?? {};
      const items = normalizeItems(metadata.items);
      const shippingMeta = safeJsonParse<Record<string, any>>(metadata.shipping);
      const billingMeta = safeJsonParse<Record<string, any>>(metadata.billing);
      const totalsMeta = safeJsonParse<{
        subtotal: number;
        total: number;
        shipping: number;
        tax: number;
        taxLabel?: string;
        shippingMethodId?: string;
        shippingMethodCode?: string;
      }>(metadata.totals);
      const guestMeta = safeJsonParse<{ email?: string; name?: string; phone?: string }>(metadata.guest);
      const resolvedItems = await resolveCheckoutItems(items);

      const guestDetails = guestMeta?.email
        ? {
            email: guestMeta.email,
            name: guestMeta.name ?? null,
            phone: guestMeta.phone ?? null,
          }
        : null;

      const hasCheckoutIdentity = Boolean(metadata.user_id || guestDetails?.email || session.customer_details?.email);

      if (items.length && hasCheckoutIdentity) {
        let receiptUrl: string | null = null;
        let paymentMethod: string | null = null;

        if (session.payment_intent && typeof session.payment_intent === 'string') {
          try {
            const intent = await stripeClient.paymentIntents.retrieve(session.payment_intent);
            paymentMethod = intent.payment_method_types?.[0] ?? null;
            receiptUrl = intent.charges?.data?.[0]?.receipt_url ?? null;
          } catch (error) {
            console.error('Unable to retrieve payment intent details:', error);
          }
        }

        await fulfillStripeOrder({
          userId: metadata.user_id ?? null,
          guest: metadata.user_id ? null : guestDetails,
          items: resolvedItems,
          amountTotal: (session.amount_total ?? 0) / 100,
          currency: session.currency ?? undefined,
          shipping: shippingMeta ?? session.customer_details?.address ?? null,
          billing: billingMeta,
          paymentIntentId:
            typeof session.payment_intent === 'string' ? session.payment_intent : session.id,
          sessionId: session.id,
          paymentStatus: session.payment_status,
          paymentMethod,
          metadata,
          receiptUrl,
          customerEmail: session.customer_details?.email ?? session.customer_email ?? guestDetails?.email ?? null,
          totals: totalsMeta ?? undefined,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
