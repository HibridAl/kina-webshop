import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;

export const stripeClient = secretKey
  ? new Stripe(secretKey, { apiVersion: '2024-06-20' })
  : null;

export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export function ensureStripeClient(): Stripe {
  if (!stripeClient) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY.');
  }
  return stripeClient;
}

export function isStripeConfigured() {
  return Boolean(stripeClient);
}
