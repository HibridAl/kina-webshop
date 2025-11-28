import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { ensureStripeClient } from '@/lib/stripe';
import {
  resolveCheckoutItems,
  type CheckoutLineItemInput,
  getServerShippingMethods,
} from '@/lib/db';
import {
  FALLBACK_SHIPPING_METHODS,
  calculateOrderTotals,
  findShippingMethod,
  type ShippingMethod,
} from '@/lib/pricing';
import { getServiceSupabase } from '@/lib/supabase-server';
import type { User as SupabaseUser } from '@supabase/supabase-js';

function mapLineItem(
  stripe: Stripe,
  currency: string,
  item: { name: string; price: number; quantity: number }
) {
  return {
    quantity: item.quantity,
    price_data: {
      currency,
      product_data: { name: item.name },
      unit_amount: Math.max(50, Math.round(item.price * 100)),
    },
  } satisfies Stripe.Checkout.SessionCreateParams.LineItem;
}

function buildMetadata(payload: Record<string, any>) {
  const entries = Object.entries(payload).filter(([, value]) => value !== undefined && value !== null);
  return entries.reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === 'string') {
      acc[key] = value;
    } else {
      acc[key] = JSON.stringify(value);
    }
    return acc;
  }, {});
}

async function requireUser(request: NextRequest): Promise<{ user: SupabaseUser } | { response: NextResponse }> {
  let client;
  try {
    client = getServiceSupabase();
  } catch (error) {
    console.error('Checkout session: missing Supabase service credentials.', error);
    return {
      response: NextResponse.json({ error: 'Server configuration error.' }, { status: 500 }),
    };
  }

  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return { response: NextResponse.json({ error: 'Authorization required.' }, { status: 401 }) };
  }

  const token = header.slice(7);
  try {
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) {
      return { response: NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401 }) };
    }
    return { user: data.user };
  } catch (error) {
    console.error('Checkout session auth error:', error);
    return { response: NextResponse.json({ error: 'Unable to verify user.' }, { status: 500 }) };
  }
}

export async function POST(request: NextRequest) {
  let stripe: Stripe;
  try {
    stripe = ensureStripeClient();
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  const authResult = await requireUser(request);
  if ('response' in authResult) {
    return authResult.response;
  }
  const authenticatedUser = authResult.user;

  try {
    const body = await request.json();
    const { items, shipping, billing, currency = 'usd', shippingMethodId } = body ?? {};

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
    }

    const resolvedItems = await resolveCheckoutItems(items as CheckoutLineItemInput[]);
    if (!resolvedItems.length) {
      return NextResponse.json({ error: 'Unable to resolve items for checkout.' }, { status: 400 });
    }

    const shippingMethods = await getServerShippingMethods();
    const allMethods = shippingMethods.length ? shippingMethods : FALLBACK_SHIPPING_METHODS;
    const selectedMethod = findShippingMethod(allMethods, shippingMethodId);

    const subtotal = resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totals = calculateOrderTotals(subtotal, selectedMethod, { country: shipping?.country });

    const normalizedCurrency = (currency ?? 'usd').toLowerCase();

    const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = resolvedItems.map((item) =>
      mapLineItem(stripe, normalizedCurrency, item)
    );

    if (selectedMethod?.price) {
      stripeLineItems.push(
        mapLineItem(stripe, normalizedCurrency, {
          name: `Shipping – ${selectedMethod.name}`,
          price: selectedMethod.price,
          quantity: 1,
        })
      );
    }

    if (totals.tax > 0) {
      stripeLineItems.push(
        mapLineItem(stripe, normalizedCurrency, {
          name: totals.taxLabel,
          price: totals.tax,
          quantity: 1,
        })
      );
    }

    const origin = request.headers.get('origin') ?? new URL(request.url).origin;

    const metadata = buildMetadata({
      user_id: authenticatedUser.id,
      items: resolvedItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      shipping,
      billing,
      totals: {
        subtotal,
        total: totals.total,
        shipping: selectedMethod?.price ?? 0,
        tax: totals.tax,
        taxLabel: totals.taxLabel,
        shippingMethodId: selectedMethod?.id,
        shippingMethodCode: selectedMethod?.code,
      },
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: stripeLineItems,
      currency: normalizedCurrency,
      success_url: `${origin}/checkout?status=success`,
      cancel_url: `${origin}/checkout?status=cancelled`,
      customer_email: shipping?.email ?? undefined,
      metadata,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout session error:', error);
    return NextResponse.json({ error: 'Unable to start checkout session.' }, { status: 500 });
  }
}
