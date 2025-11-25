'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { createOrder } from '@/lib/db';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { storeOrderReceipt } from '@/lib/order-receipt';

interface Address {
  email?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  name?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const { user, loading: userLoading } = useAuth();
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
  const [loading, setLoading] = useState(false);

  const [shipping, setShipping] = useState<Address>({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
  });

  const [billing, setBilling] = useState<Address>({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [payment, setPayment] = useState({
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
  });

  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShipping((prev) => ({ ...prev, [name]: value }));
  };

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBilling((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPayment((prev) => ({ ...prev, [name]: value }));
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipping.email || !shipping.firstName || !shipping.address || !shipping.city || !shipping.zipCode) {
      return;
    }
    if (billingSameAsShipping) {
      setBilling({
        name: `${shipping.firstName} ${shipping.lastName}`.trim(),
        address: shipping.address,
        city: shipping.city,
        state: shipping.state,
        zipCode: shipping.zipCode,
        country: shipping.country,
      });
    }
    setStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const shippingAddress = { ...shipping };
      const billingAddress = billingSameAsShipping
        ? {
            name: `${shipping.firstName} ${shipping.lastName}`.trim(),
            address: shipping.address,
            city: shipping.city,
            state: shipping.state,
            zipCode: shipping.zipCode,
            country: shipping.country,
          }
        : billing;

      if (supabaseConfigured && user) {
        const orderItemsPayload = items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
        }));

        const order = await createOrder(user.id, total, orderItemsPayload, {
          shipping: shippingAddress,
          billing: billingAddress,
        });

        if (!order) {
          throw new Error('Failed to create order in Supabase');
        }

        storeOrderReceipt({
          id: order.id,
          total,
          items: orderItemsPayload,
          shipping: shippingAddress,
          billing: billingAddress,
        });
        await clearCart();
        router.push(`/orders/${order.id}/confirmation`);
        return;
      }

      const mockOrderId = `ORD-${Date.now()}`;
      storeOrderReceipt({
        id: mockOrderId,
        total,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
        })),
        shipping: shippingAddress,
        billing: billingAddress,
      });
      await clearCart();
      router.push(`/orders/${mockOrderId}/confirmation`);
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && step !== 'payment') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Your cart is empty</h2>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {userLoading && (
            <div className="text-center py-12">
              <Loader2 className="w-6 h-6 mx-auto animate-spin mb-3" />
              <p className="text-muted-foreground text-sm">Checking your account...</p>
            </div>
          )}

          {!userLoading && !user && (
            <div className="mb-10 rounded-lg border border-border bg-card p-6 space-y-3">
              <h2 className="text-xl font-semibold">Sign in to checkout</h2>
              <p className="text-sm text-muted-foreground">
                You need an account to place an order. Sign in or create a free account, then return here to finish checkout.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href="/auth/login?next=/checkout">Sign in</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/auth/register?next=/checkout">Create account</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/cart">Back to cart</Link>
                </Button>
              </div>
            </div>
          )}

          {!userLoading && user && (
            <>
              <div className="flex gap-4 mb-12">
                {['shipping', 'payment'].map((s, idx) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        step === s ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className="capitalize hidden sm:inline">{s}</span>
                  </div>
                ))}
              </div>

              {step === 'shipping' && (
                <form onSubmit={handleShippingSubmit} className="space-y-6 bg-card border border-border p-6 rounded-lg">
                  <h2 className="text-2xl font-bold">Shipping Information</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={shipping.firstName}
                        onChange={handleShippingChange}
                        required
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={shipping.lastName}
                        onChange={handleShippingChange}
                        required
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={shipping.email}
                        onChange={handleShippingChange}
                        required
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={shipping.phone}
                        onChange={handleShippingChange}
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={shipping.address}
                      onChange={handleShippingChange}
                      required
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={shipping.city}
                        onChange={handleShippingChange}
                        required
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">State / Province</label>
                      <input
                        type="text"
                        name="state"
                        value={shipping.state}
                        onChange={handleShippingChange}
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">ZIP / Postal Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={shipping.zipCode}
                        onChange={handleShippingChange}
                        required
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={shipping.country}
                      onChange={handleShippingChange}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="billingSame"
                      type="checkbox"
                      checked={billingSameAsShipping}
                      onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                    />
                    <label htmlFor="billingSame" className="text-sm text-muted-foreground">
                      Billing address matches shipping
                    </label>
                  </div>

                  {!billingSameAsShipping && (
                    <div className="space-y-4 border border-border rounded-lg p-4">
                      <h3 className="font-medium">Billing Address</h3>
                      <div>
                        <label className="block text-sm font-medium mb-2">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          value={billing.name}
                          onChange={handleBillingChange}
                          className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Address</label>
                        <input
                          type="text"
                          name="address"
                          value={billing.address}
                          onChange={handleBillingChange}
                          className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          type="text"
                          name="city"
                          placeholder="City"
                          value={billing.city}
                          onChange={handleBillingChange}
                          className="px-4 py-2 border border-border rounded-lg bg-background"
                        />
                        <input
                          type="text"
                          name="state"
                          placeholder="State"
                          value={billing.state}
                          onChange={handleBillingChange}
                          className="px-4 py-2 border border-border rounded-lg bg-background"
                        />
                        <input
                          type="text"
                          name="zipCode"
                          placeholder="ZIP"
                          value={billing.zipCode}
                          onChange={handleBillingChange}
                          className="px-4 py-2 border border-border rounded-lg bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Country</label>
                        <input
                          type="text"
                          name="country"
                          value={billing.country}
                          onChange={handleBillingChange}
                          className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between gap-4">
                    <Button variant="outline" asChild>
                      <Link href="/cart">Back to cart</Link>
                    </Button>
                    <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                      Continue to payment
                    </Button>
                  </div>
                </form>
              )}

              {step === 'payment' && (
                <form onSubmit={handlePaymentSubmit} className="space-y-6 bg-card border border-border p-6 rounded-lg">
                  <h2 className="text-2xl font-bold">Payment Information</h2>

                  <div>
                    <label className="block text-sm font-medium mb-2">Cardholder Name</label>
                    <input
                      type="text"
                      name="cardName"
                      value={payment.cardName}
                      onChange={handlePaymentChange}
                      required
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Card Number</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={payment.cardNumber}
                      onChange={handlePaymentChange}
                      placeholder="1234 5678 9012 3456"
                      required
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Expiration Date</label>
                      <input
                        type="text"
                        name="cardExpiry"
                        value={payment.cardExpiry}
                        onChange={handlePaymentChange}
                        placeholder="MM/YY"
                        required
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">CVV</label>
                      <input
                        type="text"
                        name="cardCVC"
                        value={payment.cardCVC}
                        onChange={handlePaymentChange}
                        placeholder="123"
                        required
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between gap-4">
                    <Button type="button" variant="outline" onClick={() => setStep('shipping')}>
                      Back to shipping
                    </Button>
                    <Button
                      type="submit"
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Pay $${total.toFixed(2)}`
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
