'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/hooks/use-auth';
import { getOrderById, getOrderItems } from '@/lib/db';
import type { Order, OrderItem } from '@/lib/types';
import { getStoredOrderReceipt, type StoredOrderReceipt } from '@/lib/order-receipt';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PageProps {
  params: { id: string };
}

export default function OrderDetailPage({ params }: PageProps) {
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [localReceipt, setLocalReceipt] = useState<StoredOrderReceipt | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabaseConfigured) {
        if (!active) return;
        setLocalReceipt(getStoredOrderReceipt(params.id));
        setStatus('idle');
        return;
      }
      if (!user) return;
      setStatus('loading');
      try {
        const fetchedOrder = await getOrderById(params.id);
        if (!fetchedOrder || fetchedOrder.user_id !== user.id) {
          setErrorMessage('Order not found');
          setStatus('error');
          return;
        }
        const fetchedItems = await getOrderItems(params.id);
        if (active) {
          setOrder(fetchedOrder);
          setItems(fetchedItems);
          setStatus('idle');
        }
      } catch (error) {
        console.error('Failed to load order', error);
        if (active) {
          setErrorMessage('Unable to load order details right now.');
          setStatus('error');
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [params.id, supabaseConfigured, user]);

  const readyOrder = order || (localReceipt ? mockOrderFromReceipt(localReceipt) : null);
  const readyItems: Array<OrderItem | StoredOrderReceipt['items'][number]> = order
    ? items
    : localReceipt?.items ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Order</p>
              <h1 className="text-3xl font-bold">#{params.id}</h1>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/account/orders">Back to orders</Link>
              </Button>
              <Button asChild size="sm">
                <Link href={`/orders/${params.id}/confirmation`}>View confirmation</Link>
              </Button>
            </div>
          </div>

          {!supabaseConfigured && !localReceipt && (
            <div className="rounded-lg border border-border p-6 bg-card text-sm text-muted-foreground">
              Connect Supabase or open this page right after placing a mock order to preview details.
            </div>
          )}

          {supabaseConfigured && !user && !authLoading && (
            <div className="rounded-lg border border-border p-6 bg-card">
              <p className="text-sm text-muted-foreground">Sign in to view order details.</p>
              <div className="flex gap-3 pt-3">
                <Button asChild size="sm">
                  <Link href={`/auth/login?next=/orders/${params.id}`}>Sign in</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/auth/register?next=/orders/${params.id}`}>Create account</Link>
                </Button>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading order...
            </div>
          )}

          {status === 'error' && errorMessage && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          {readyOrder && (
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-card p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Order info</h3>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{readyOrder.status ?? 'pending'}</p>
                  <p className="text-sm text-muted-foreground mt-4">Placed</p>
                  <p className="font-medium">
                    {readyOrder.created_at ? new Date(readyOrder.created_at).toLocaleString() : '—'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-4">Total</p>
                  <p className="font-semibold text-lg">${Number(readyOrder.total_amount ?? localReceipt?.total ?? 0).toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Shipping to</h3>
                  <AddressBlock data={(readyOrder.shipping_address as Record<string, any>) || localReceipt?.shipping} />
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="font-semibold mb-4">Items</h3>
                <div className="space-y-4">
                  {readyItems.map((item) => {
                    const isRemote = 'price_at_purchase' in item;
                    const linePrice = Number(isRemote ? item.price_at_purchase : item.price);
                    const lineName = isRemote
                      ? item.products?.name ?? 'Product'
                      : item.name;
                    const key = isRemote ? item.product_id : item.productId;
                    return (
                      <div key={key} className="flex justify-between">
                        <div>
                          <p className="font-medium">{lineName}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty {item.quantity} · ${linePrice.toFixed(2)} each
                          </p>
                        </div>
                        <p className="font-semibold">${(linePrice * item.quantity).toFixed(2)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="font-semibold mb-2">Billing</h3>
                <AddressBlock data={(readyOrder.billing_address as Record<string, any>) || localReceipt?.billing} />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function AddressBlock({ data }: { data?: Record<string, any> | null }) {
  if (!data) {
    return <p className="text-sm text-muted-foreground">Not provided.</p>;
  }
  return (
    <div className="text-sm text-muted-foreground space-y-1">
      {data.name || data.firstName ? (
        <p className="font-medium text-foreground">{data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim()}</p>
      ) : null}
      {data.email ? <p>{data.email}</p> : null}
      <p>
        {data.address}
        {data.city ? `, ${data.city}` : ''}
        {data.state ? `, ${data.state}` : ''}
        {data.zipCode ? ` ${data.zipCode}` : ''}
      </p>
      {data.country ? <p>{data.country}</p> : null}
      {data.phone ? <p>Phone: {data.phone}</p> : null}
    </div>
  );
}

function mockOrderFromReceipt(receipt: NonNullable<ReturnType<typeof getStoredOrderReceipt>>): Order {
  return {
    id: receipt.id,
    user_id: 'local',
    total_amount: receipt.total,
    status: 'pending',
    shipping_address: receipt.shipping,
    billing_address: receipt.billing,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as Order;
}
