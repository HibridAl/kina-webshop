'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/hooks/use-auth';
import { getOrderById, getOrderItems } from '@/lib/db';
import type { Order, OrderItem } from '@/lib/types';
import {
  clearStoredOrderReceipt,
  getStoredOrderReceipt,
  type StoredOrderReceipt,
} from '@/lib/order-receipt';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface PageProps {
  params: { id: string };
}

export default function OrderConfirmationPage({ params }: PageProps) {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [receipt, setReceipt] = useState<StoredOrderReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabaseConfigured) {
        const stored = getStoredOrderReceipt(params.id);
        setReceipt(stored);
        setLoading(false);
        if (stored) {
          clearStoredOrderReceipt();
        }
        return;
      }

      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const fetchedOrder = await getOrderById(params.id);
        if (!fetchedOrder || fetchedOrder.user_id !== user.id) {
          setError('Order not found.');
          setLoading(false);
          return;
        }
        const fetchedItems = await getOrderItems(params.id);
        if (active) {
          setOrder(fetchedOrder);
          setItems(fetchedItems);
        }
      } catch (err) {
        console.error('Failed to load confirmation', err);
        setError('Unable to load this order.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [params.id, supabaseConfigured, user]);

  const readyItems: Array<OrderItem | StoredOrderReceipt['items'][number]> = order
    ? items
    : receipt?.items ?? [];

  const total = order?.total_amount ?? receipt?.total ?? 0;
  const shipping = (order?.shipping_address as Record<string, any>) || receipt?.shipping;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <div>
            <h1 className="text-4xl font-bold mb-2">Order received</h1>
            <p className="text-muted-foreground">
              Confirmation <span className="font-mono">#{params.id}</span> is secured and we&apos;ve emailed the receipt along with next steps for tracking.
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Preparing your receipt...
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && (order || receipt) && (
            <div className="text-left space-y-6">
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="font-semibold mb-2">Shipping to</h3>
                <AddressBlock data={shipping} />
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="font-semibold mb-4">Items</h3>
                <div className="space-y-3">
                  {readyItems.map((line) => {
                    const isRemote = 'price_at_purchase' in line;
                    const linePrice = Number(isRemote ? line.price_at_purchase : line.price);
                    const lineName = isRemote ? line.products?.name ?? 'Product' : line.name;
                    const key = isRemote ? line.product_id : line.productId;
                    return (
                      <div key={key} className="flex justify-between text-sm">
                        <span>
                          {lineName} <span className="text-muted-foreground">× {line.quantity}</span>
                        </span>
                        <span>${(linePrice * line.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-border mt-4 pt-4 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${Number(total).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="/products">Continue shopping</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/account">View in Account</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href={`/orders/${params.id}`}>Order details</Link>
                </Button>
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
  if (!data) return <p className="text-sm text-muted-foreground">Details coming soon.</p>;
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
