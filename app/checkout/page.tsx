'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { createOrder, getShippingMethods, type GuestOrderDetails } from '@/lib/db';
import Link from 'next/link';
import { Loader2, CheckCircle2, Truck, CreditCard, ShieldCheck, Zap } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { storeOrderReceipt } from '@/lib/order-receipt';
import { OrderSummary } from '@/components/order-summary';
import { cn } from '@/lib/utils';
import { LocalizedText } from '@/components/ui/localized-text';
import {
  FALLBACK_SHIPPING_METHODS,
  calculateOrderTotals,
  findShippingMethod,
  getDefaultShippingMethod,
  type ShippingMethod,
} from '@/lib/pricing';
import { CHECKOUT_MOCK_ADDRESSES } from '@/lib/mock-addresses';
import { Address } from '@/components/address-card';
import { MapPin, Plus } from 'lucide-react';

const DEFAULT_SHIPPING_METHOD = getDefaultShippingMethod(FALLBACK_SHIPPING_METHODS);

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusHandledRef = useRef<string | null>(null);
  const { items, total: subtotal, clearCart } = useCart();
  const { user, session, loading: userLoading } = useAuth();
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const [step, setStep] = useState<'shipping' | 'method' | 'payment'>('shipping');
  const [loading, setLoading] = useState(false);
  const [bannerStatus, setBannerStatus] = useState<'success' | 'cancelled' | null>(null);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>(FALLBACK_SHIPPING_METHODS);
  const [shippingMethodsLoading, setShippingMethodsLoading] = useState(false);

  // Address Selection State
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');

  const [shipping, setShipping] = useState<Partial<Address>>({
    name: '',
    address_line1: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phone: '',
  });

  const [shippingMethodId, setShippingMethodId] = useState(DEFAULT_SHIPPING_METHOD.id);

  const [billing, setBilling] = useState<Partial<Address>>({
    name: '',
    address_line1: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  });
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [payment, setPayment] = useState({
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
  });
  const [stripeLoading, setStripeLoading] = useState(false);

  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const stripeEnabled = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

  // Load saved addresses on auth
  useEffect(() => {
    if (user) {
      // Simulate fetch
      setSavedAddresses(CHECKOUT_MOCK_ADDRESSES);
      const defaultAddr = CHECKOUT_MOCK_ADDRESSES.find(a => a.is_default_shipping);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        setShipping(defaultAddr);
      }
    }
  }, [user]);

  const handleAddressSelect = (id: string) => {
    setSelectedAddressId(id);
    if (id === 'new') {
      setShipping({
        name: '',
        address_line1: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        phone: '',
      });
    } else {
      const addr = savedAddresses.find(a => a.id === id);
      if (addr) {
        setShipping(addr);
      }
    }
  };

useEffect(() => {
  if (!searchParams) return;
  const status = searchParams.get('status');
  if (!status || statusHandledRef.current === status) return;
  if (status === 'success' || status === 'cancelled') {
      setBannerStatus(status);
      statusHandledRef.current = status;
      if (status === 'success') {
        clearCart().catch((error) => console.error('Failed to clear cart after Stripe success:', error));
      }
  }
}, [searchParams, clearCart]);

useEffect(() => {
  let cancelled = false;
  async function loadShippingMethods() {
    try {
      setShippingMethodsLoading(true);
      const methods = await getShippingMethods();
      if (cancelled) return;
      const normalized = methods?.length ? methods : FALLBACK_SHIPPING_METHODS;
      setShippingMethods(normalized);
      setShippingMethodId((current) => {
        if (normalized.some((method) => method.id === current)) {
          return current;
        }
        return getDefaultShippingMethod(normalized).id;
      });
    } catch (error) {
      if (!cancelled) {
        console.error('Failed to load shipping methods:', error);
      }
    } finally {
      if (!cancelled) {
        setShippingMethodsLoading(false);
      }
    }
  }
  loadShippingMethods();
  return () => {
    cancelled = true;
  };
}, []);

  // Calculations
  const selectedMethod = findShippingMethod(shippingMethods, shippingMethodId);
  const totals = useMemo(
    () => calculateOrderTotals(subtotal, selectedMethod, { country: shipping.country }),
    [subtotal, selectedMethod, shipping.country]
  );
  const shippingCost = totals.shipping;
  const taxAmount = totals.tax;
  const total = totals.total;
  const taxLabel = totals.taxLabel;

  const shippingAddress = useMemo(
    () => ({
      ...shipping,
      method: selectedMethod.name,
      methodId: selectedMethod.id,
      methodCode: selectedMethod.code,
      deliveryEstimate: selectedMethod.deliveryEstimate,
      shippingCost,
    }),
    [shipping, selectedMethod, shippingCost]
  );

  const billingAddress = useMemo(() => {
    if (billingSameAsShipping) {
      return {
        name: shipping.name,
        address_line1: shipping.address_line1,
        city: shipping.city,
        state: shipping.state,
        zip: shipping.zip,
        country: shipping.country,
      } as Partial<Address>;
    }
    return billing;
  }, [billingSameAsShipping, billing, shipping]);

  const guestDetails = useMemo<GuestOrderDetails | null>(() => {
    if (user || !isGuestCheckout) return null;
    // For guest, we might map 'name' to a stored email if we simplified the form, 
    // but let's assume we kept the guest fields separately or reused 'name' for full name 
    // and need to ensure email is captured.
    // Wait, I replaced the state definition of 'shipping' to match Address type which doesn't have 'firstName'/'lastName' but 'name'.
    // I need to check if I broke guest email capture. Address interface usually doesn't have email.
    // Let's add email to the shipping state for checkout specifically.
    const email = (shipping as any).email?.trim(); 
    if (!email) return null;
    return {
      email,
      name: shipping.name,
      phone: shipping.phone,
    };
  }, [user, isGuestCheckout, shipping]);

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
    // Validate basic fields
    if (!shipping.address_line1 || !shipping.city || !shipping.zip || !shipping.country) {
        // Simple validation
        alert('Please fill in all required address fields.');
        return;
    }
    if (!user && !(shipping as any).email) {
        alert('Guest email is required.');
        return;
    }

    if (billingSameAsShipping) {
      setBilling({
        name: shipping.name,
        address_line1: shipping.address_line1,
        city: shipping.city,
        state: shipping.state,
        zip: shipping.zip,
        country: shipping.country,
      });
    }
    setStep('method');
  };

const handleMethodSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setStep('payment');
};

  const ensureGuestContact = () => {
    if (!user && isGuestCheckout && !(shipping as any).email) {
      alert('Please provide an email address to checkout as a guest.');
      return false;
    }
    return true;
  };

  const handleStripeCheckout = async () => {
    if (!user && !isGuestCheckout) {
      alert('Please sign in to complete checkout.');
      return;
    }

    if (!ensureGuestContact()) {
      return;
    }

    if (user && !session?.access_token) {
      alert('Unable to verify your session. Please sign in again.');
      return;
    }

    setStripeLoading(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/checkout/session', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          shipping: shippingAddress,
          billing: billingAddress,
          currency: 'usd',
          shippingMethodId,
          guest: guestDetails ?? undefined,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error ?? 'Unable to start secure checkout.');
      }

      const data = await response.json();
      if (data?.url) {
        window.location.assign(data.url as string);
        return;
      }

      throw new Error('Missing Stripe redirect URL.');
    } catch (error) {
      console.error('Stripe checkout error:', error);
      alert('We could not start the payment session. Please try again.');
    } finally {
      setStripeLoading(false);
    }
  };

  const handleMockPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
        })),
        shipping: shippingAddress,
        billing: billingAddress,
        subtotal,
        tax: taxAmount,
        taxLabel,
        shippingCost,
        total,
      };

      if (supabaseConfigured) {
        if (!ensureGuestContact()) {
          return;
        }

        const order = await createOrder(user?.id ?? null, total, orderData.items, {
          shipping: shippingAddress,
          billing: billingAddress,
          guest: guestDetails,
        });

        if (!order) {
          throw new Error('Failed to create order in Supabase');
        }

        storeOrderReceipt({
          id: order.id,
          ...orderData,
        });
        await clearCart();
        router.push(`/orders/${order.id}/confirmation`);
        return;
      }

      const mockOrderId = `ORD-${Date.now()}`;
      storeOrderReceipt({
        id: mockOrderId,
        ...orderData,
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

  if (items.length === 0 && step === 'shipping') { // Only redirect if starting fresh
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">
              <LocalizedText hu="Üres a kosara" en="Your cart is empty" />
            </h2>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/products">
                <LocalizedText hu="Vásárlás folytatása" en="Continue Shopping" />
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const steps = [
    { id: 'shipping', label: <LocalizedText hu="Szállítás" en="Shipping" />, icon: CheckCircle2 },
    { id: 'method', label: <LocalizedText hu="Mód" en="Method" />, icon: Truck },
    { id: 'payment', label: <LocalizedText hu="Fizetés" en="Payment" />, icon: CreditCard },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <Header />
      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {userLoading && (
            <div className="text-center py-12">
              <Loader2 className="w-6 h-6 mx-auto animate-spin mb-3" />
              <p className="text-muted-foreground text-sm">
                <LocalizedText hu="Fiók ellenőrzése..." en="Checking your account..." />
              </p>
            </div>
          )}

          {!userLoading && !user && !isGuestCheckout && (
            <div className="max-w-lg mx-auto mb-10 rounded-lg border border-border bg-card p-6 space-y-3">
              <h2 className="text-xl font-semibold">
                <LocalizedText hu="Jelentkezzen be a vásárláshoz" en="Sign in to checkout" />
              </h2>
              <p className="text-sm text-muted-foreground">
                <LocalizedText
                  hu="A rendelés leadásához fiók szükséges, vagy folytathatja vendégként is."
                  en="You can sign in to save your details, or continue as a guest to checkout quickly."
                />
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href="/auth/login?next=/checkout">
                    <LocalizedText hu="Bejelentkezés" en="Sign in" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/auth/register?next=/checkout">
                    <LocalizedText hu="Fiók létrehozása" en="Create account" />
                  </Link>
                </Button>
                <Button variant="secondary" onClick={() => setIsGuestCheckout(true)}>
                  <LocalizedText hu="Folytatás vendégként" en="Continue as guest" />
                </Button>
              </div>
              <div className="pt-2">
                <Button asChild variant="link" className="px-0 text-muted-foreground">
                  <Link href="/cart">
                    <LocalizedText hu="Vissza a kosárhoz" en="Back to cart" />
                  </Link>
                </Button>
              </div>
            </div>
          )}

          {!userLoading && (user || isGuestCheckout) && (
            <>
              {bannerStatus && (
                <div
                  className={cn(
                    'mb-8 rounded-2xl border p-4 flex items-start gap-3',
                    bannerStatus === 'success'
                      ? 'border-green-400/40 bg-green-500/5 text-green-800'
                      : 'border-amber-400/40 bg-amber-100 text-amber-800'
                  )}
                >
                  <ShieldCheck className="w-5 h-5 mt-1" />
                  <div>
                    <p className="font-semibold">
                      {bannerStatus === 'success' ? (
                        <LocalizedText hu="Fizetés sikeres" en="Payment received" />
                      ) : (
                        <LocalizedText hu="Fizetés megszakítva" en="Checkout cancelled" />
                      )}
                    </p>
                    <p className="text-sm">
                      {bannerStatus === 'success' ? (
                        <LocalizedText
                          hu="Rendelését véglegesítjük. Hamarosan visszaigazolást küldünk e-mailben."
                          en="We are finalizing your order. A confirmation will arrive in your inbox shortly."
                        />
                      ) : (
                        <LocalizedText
                          hu="Megszakította a fizetést. Áttekintheti a kosarát és újrapróbálkozhat."
                          en="You exited Stripe without completing payment. You can review your cart and try again."
                        />
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content - Forms */}
              <div className="lg:col-span-2 space-y-8">
                {/* Steps Indicator */}
                <div className="flex justify-between items-center max-w-md mb-8">
                  {steps.map((s, idx) => {
                    const isActive = step === s.id;
                    const isCompleted = steps.findIndex(stepItem => stepItem.id === step) > idx;
                    
                    return (
                      <div key={s.id} className="flex flex-col items-center relative z-10">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors duration-200",
                            isActive ? "bg-accent text-accent-foreground" : 
                            isCompleted ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                        </div>
                        <span className={cn(
                          "text-xs mt-2 font-medium",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                  {/* Progress Bar Background could go here but keeping it simple for now */}
                </div>

                {step === 'shipping' && (
                  <form onSubmit={handleShippingSubmit} className="space-y-6 bg-card border border-border p-6 rounded-lg">
                    <h2 className="text-2xl font-bold">
                      <LocalizedText hu="Szállítási adatok" en="Shipping Information" />
                    </h2>

                    {user && savedAddresses.length > 0 && (
                      <div className="grid gap-3 mb-6">
                        <div className="text-sm font-medium text-muted-foreground">
                          <LocalizedText hu="Mentett címek" en="Saved Addresses" />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {savedAddresses.map((addr) => (
                            <div
                              key={addr.id}
                              onClick={() => handleAddressSelect(addr.id)}
                              className={cn(
                                "cursor-pointer rounded-xl border p-3 transition-all hover:bg-muted/50",
                                selectedAddressId === addr.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                              )}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{addr.name}</span>
                                {selectedAddressId === addr.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <p>{addr.address_line1}</p>
                                <p>{addr.city}, {addr.zip}</p>
                              </div>
                            </div>
                          ))}
                          <div
                            onClick={() => handleAddressSelect('new')}
                            className={cn(
                              "cursor-pointer flex items-center justify-center gap-2 rounded-xl border border-dashed p-3 transition-all hover:bg-muted/50",
                              selectedAddressId === 'new' ? "border-primary bg-primary/5" : "border-border"
                            )}
                          >
                            <Plus className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              <LocalizedText hu="Új cím" en="New Address" />
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          <LocalizedText hu="Teljes név" en="Full Name" />
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={shipping.name}
                          onChange={handleShippingChange}
                          required
                          className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">E-mail</label>
                        <input
                          type="email"
                          name="email"
                          value={(shipping as any).email || ''}
                          onChange={handleShippingChange}
                          required={!user}
                          className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          <LocalizedText hu="Telefonszám" en="Phone" />
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={shipping.phone}
                          onChange={handleShippingChange}
                          className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <LocalizedText hu="Cím" en="Address" />
                      </label>
                      <input
                        type="text"
                        name="address_line1"
                        value={shipping.address_line1}
                        onChange={handleShippingChange}
                        required
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          <LocalizedText hu="Város" en="City" />
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={shipping.city}
                          onChange={handleShippingChange}
                          required
                          className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          <LocalizedText hu="Megye / Állam" en="State / Province" />
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={shipping.state}
                          onChange={handleShippingChange}
                          className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          <LocalizedText hu="Irányítószám" en="ZIP / Postal Code" />
                        </label>
                        <input
                          type="text"
                          name="zip"
                          value={shipping.zip}
                          onChange={handleShippingChange}
                          required
                          className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <LocalizedText hu="Ország" en="Country" />
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={shipping.country}
                        onChange={handleShippingChange}
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        id="billingSame"
                        type="checkbox"
                        checked={billingSameAsShipping}
                        onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                        className="rounded border-gray-300 text-accent focus:ring-accent"
                      />
                      <label htmlFor="billingSame" className="text-sm text-muted-foreground cursor-pointer select-none">
                        <LocalizedText
                          hu="A számlázási cím megegyezik a szállítási címmel"
                          en="Billing address matches shipping"
                        />
                      </label>
                    </div>

                    {!billingSameAsShipping && (
                      <div className="space-y-4 border border-border rounded-lg p-4 mt-4 bg-muted/30">
                        <h3 className="font-medium">
                          <LocalizedText hu="Számlázási cím" en="Billing Address" />
                        </h3>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            <LocalizedText hu="Teljes név" en="Full Name" />
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={billing.name}
                            onChange={handleBillingChange}
                            className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            <LocalizedText hu="Cím" en="Address" />
                          </label>
                          <input
                            type="text"
                            name="address_line1"
                            value={billing.address_line1}
                            onChange={handleBillingChange}
                            className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input
                            type="text"
                            name="city"
                            placeholder="City"
                            value={billing.city}
                            onChange={handleBillingChange}
                            className="px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                          />
                          <input
                            type="text"
                            name="state"
                            placeholder="State"
                            value={billing.state}
                            onChange={handleBillingChange}
                            className="px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                          />
                          <input
                            type="text"
                            name="zip"
                            placeholder="ZIP"
                            value={billing.zip}
                            onChange={handleBillingChange}
                            className="px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            <LocalizedText hu="Ország" en="Country" />
                          </label>
                          <input
                            type="text"
                            name="country"
                            value={billing.country}
                            onChange={handleBillingChange}
                            className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between gap-4 pt-4">
                      <Button variant="outline" asChild>
                        <Link href="/cart">
                          <LocalizedText hu="Vissza a kosárhoz" en="Back to cart" />
                        </Link>
                      </Button>
                      <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        <LocalizedText hu="Tovább a szállításhoz" en="Continue to Method" />
                      </Button>
                    </div>
                  </form>
                )}

                {step === 'method' && (
                  <form onSubmit={handleMethodSubmit} className="space-y-6 bg-card border border-border p-6 rounded-lg">
                    <h2 className="text-2xl font-bold">
                      <LocalizedText hu="Szállítási mód" en="Select Shipping Method" />
                    </h2>

                    {shippingMethodsLoading && (
                      <p className="text-sm text-muted-foreground">
                        <LocalizedText hu="Opciók frissítése…" en="Refreshing shipping options…" />
                      </p>
                    )}

                    <div className="space-y-3">
                      {shippingMethods.map((method) => (
                        <div 
                          key={method.id}
                          onClick={() => setShippingMethodId(method.id)}
                          className={cn(
                            "flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all hover:border-accent/50 hover:bg-accent/5",
                            shippingMethodId === method.id ? "border-accent bg-accent/10 ring-1 ring-accent shadow-sm" : "border-border bg-card"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-full border",
                              shippingMethodId === method.id ? "border-accent bg-accent/20 text-accent-foreground" : "border-border bg-muted/50 text-muted-foreground"
                            )}>
                              {method.isExpress ? <Zap className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{method.name}</p>
                                {method.isExpress && (
                                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase text-accent-foreground">
                                    Express
                                  </span>
                                )}
                              </div>
                              {(method.deliveryEstimate || method.description) && (
                                <p className="text-sm text-muted-foreground">
                                  {method.deliveryEstimate ?? method.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              ${method.price.toFixed(2)}
                            </div>
                            {shippingMethodId === method.id && (
                              <CheckCircle2 className="ml-auto mt-1 h-4 w-4 text-accent" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between gap-4 pt-4">
                      <Button type="button" variant="outline" onClick={() => setStep('shipping')}>
                        <LocalizedText hu="Vissza a címhez" en="Back to Address" />
                      </Button>
                      <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        <LocalizedText hu="Tovább a fizetéshez" en="Continue to Payment" />
                      </Button>
                    </div>
                  </form>
                )}

                {step === 'payment' && (
                  stripeEnabled ? (
                    <div className="space-y-6 bg-card border border-border p-6 rounded-lg">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-accent" />
                        <div>
                          <h2 className="text-2xl font-bold">
                            <LocalizedText hu="Biztonságos fizetés" en="Secure Payment" />
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            <LocalizedText
                              hu="Fizessen biztonságosan a Stripe rendszerén keresztül."
                              en="Complete checkout through Stripe's encrypted payment flow and return here for confirmation."
                            />
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4 rounded-xl border border-border p-4">
                        {items.map((item) => (
                          <div key={item.productId} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {item.name} × {item.quantity}
                            </span>
                            <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
                          <span>
                            <LocalizedText hu="Részösszeg" en="Subtotal" />
                          </span>
                          <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>
                            <LocalizedText hu="Szállítás" en="Shipping" /> ({selectedMethod.name}
                            {selectedMethod.deliveryEstimate ? ` • ${selectedMethod.deliveryEstimate}` : ''})
                          </span>
                          <span>${shippingCost.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground pb-2 border-b border-border">
                          <span>
                            <LocalizedText hu="Becsült adó" en="Estimated tax" /> ({taxLabel})
                          </span>
                          <span>${taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-lg font-semibold">
                          <span>
                            <LocalizedText hu="Összesen" en="Total due" />
                          </span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <Button type="button" variant="outline" onClick={() => setStep('method')}>
                          <LocalizedText hu="Vissza a szállítási módhoz" en="Back to Method" />
                        </Button>
                        <Button
                          type="button"
                          className="bg-accent hover:bg-accent/90 text-accent-foreground flex-1"
                          disabled={stripeLoading}
                          onClick={handleStripeCheckout}
                        >
                          {stripeLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              <LocalizedText hu="Fizetés indítása..." en="Starting secure checkout..." />
                            </>
                          ) : (
                            <>
                              <LocalizedText hu="Fizetés Stripe-pal" en="Pay with Stripe" />
                              {` $${total.toFixed(2)}`}
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <LocalizedText
                          hu="Módosítani szeretne? A Stripe oldalon megszakíthatja a folyamatot, és visszatérhet ide anélkül, hogy elveszítené a kosarát."
                          en="Need to make a change? You can cancel on the Stripe page and return here without losing your cart."
                        />
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleMockPaymentSubmit} className="space-y-6 bg-card border border-border p-6 rounded-lg">
                      <h2 className="text-2xl font-bold">
                        <LocalizedText hu="Fizetési adatok" en="Payment Information" />
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        <LocalizedText
                          hu="A Stripe nincs konfigurálva, így a kártyaadatok megadása helyi szimulációval történik."
                          en="Stripe isn't configured yet, so card entry happens locally. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable hosted checkout."
                        />
                      </p>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          <LocalizedText hu="Kártyabirtokos neve" en="Cardholder Name" />
                        </label>
                        <input
                          type="text"
                          name="cardName"
                          value={payment.cardName}
                          onChange={handlePaymentChange}
                          required
                          className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          <LocalizedText hu="Kártyaszám" en="Card Number" />
                        </label>
                        <input
                          type="text"
                          name="cardNumber"
                          value={payment.cardNumber}
                          onChange={handlePaymentChange}
                          placeholder="1234 5678 9012 3456"
                          required
                          className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            <LocalizedText hu="Lejárati dátum" en="Expiration Date" />
                          </label>
                          <input
                            type="text"
                            name="cardExpiry"
                            value={payment.cardExpiry}
                            onChange={handlePaymentChange}
                            placeholder="MM/YY"
                            required
                            className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
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
                            className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between gap-4 pt-4">
                        <Button type="button" variant="outline" onClick={() => setStep('method')}>
                          <LocalizedText hu="Vissza a szállítási módhoz" en="Back to Method" />
                        </Button>
                        <Button
                          type="submit"
                          className="bg-accent hover:bg-accent/90 text-accent-foreground"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              <LocalizedText hu="Feldolgozás..." en="Processing..." />
                            </>
                          ) : (
                            <>
                              <LocalizedText hu="Fizetés" en="Pay" /> {` $${total.toFixed(2)}`}
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  )
                )}
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <OrderSummary
                  subtotal={subtotal}
                  shipping={shippingCost}
                  tax={taxAmount}
                  total={total}
                  className="sticky top-24"
                />
                <div className="mt-4 text-xs text-muted-foreground space-y-1">
                  <p>
                    Shipping: {selectedMethod.name}
                    {selectedMethod.deliveryEstimate ? ` (${selectedMethod.deliveryEstimate})` : ''}
                  </p>
                  <p>{taxLabel}</p>
                </div>
              </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
