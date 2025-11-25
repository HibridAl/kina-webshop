'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, PackageOpen } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/hooks/use-auth';
import { getOrders } from '@/lib/db';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';

export default function AccountOrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(false);
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    let active = true;
    async function loadOrders() {
      if (!user || !supabaseConfigured) return;
      setFetching(true);
      try {
        const data = await getOrders(user.id);
        if (active) setOrders(data);
      } catch (error) {
        console.error('Failed to load orders', error);
      } finally {
        if (active) setFetching(false);
      }
    }
    loadOrders();
    return () => {
      active = false;
    };
  }, [supabaseConfigured, user]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Order history</h1>
            <p className="text-muted-foreground text-sm">Review past purchases and track fulfillment status.</p>
          </div>

          {!supabaseConfigured && (
            <div className="rounded-lg border border-border p-6 bg-card">
              <p className="text-sm text-muted-foreground">
                Connect Supabase to enable persistent orders. For now, mock orders only appear on the confirmation screen.
              </p>
            </div>
          )}

          {supabaseConfigured && (
            <>
              {loading || fetching ? (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading orders...
                </div>
              ) : null}

              {!loading && supabaseConfigured && !user && (
                <div className="rounded-lg border border-border p-6 bg-card space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Sign in to view your orders.
                  </p>
                  <div className="flex gap-3">
                    <Button asChild size="sm">
                      <Link href="/auth/login?next=/account/orders">Sign in</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/auth/register?next=/account/orders">Create account</Link>
                    </Button>
                  </div>
                </div>
              )}

              {user && orders.length === 0 && !fetching && (
                <div className="rounded-lg border border-dashed border-border p-10 text-center space-y-4">
                  <PackageOpen className="w-10 h-10 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-semibold">No orders yet</p>
                    <p className="text-sm text-muted-foreground">Place an order to see it listed here.</p>
                  </div>
                  <Button asChild>
                    <Link href="/products">Start shopping</Link>
                  </Button>
                </div>
              )}

              {user && orders.length > 0 && (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="rounded-lg border border-border p-6 bg-card flex flex-col gap-4">
                      <div className="flex flex-wrap justify-between gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Order ID</p>
                          <p className="font-mono text-sm">{order.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Placed</p>
                          <p className="font-medium">{new Date(order.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-between items-center gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <p className="font-semibold capitalize">{order.status}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="font-semibold">${Number(order.total_amount).toFixed(2)}</p>
                        </div>
                        <div className="ml-auto flex gap-3">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/orders/${order.id}`}>View details</Link>
                          </Button>
                          <Button asChild size="sm">
                            <Link href={`/orders/${order.id}/confirmation`}>Confirmation</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
