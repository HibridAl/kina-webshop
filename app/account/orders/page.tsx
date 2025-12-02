'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, PackageOpen, RefreshCw, Eye, ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getOrders, reorderPreviousOrder, getOrderItems } from '@/lib/db';
import type { Order, OrderItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocalizedText } from '@/components/ui/localized-text';
import { toast } from 'sonner';

export default function AccountOrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, OrderItem[]>>({});
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
        if (active) {
          setOrders(data);
          const itemsMap: Record<string, OrderItem[]> = {};
          for (const order of data) {
            itemsMap[order.id] = await getOrderItems(order.id);
          }
          if (active) setOrderItemsMap(itemsMap);
        }
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

  const handleReorder = async (orderId: string) => {
    if (!user) return;
    toast.promise(reorderPreviousOrder(user.id, orderId), {
      loading: 'Adding items to your cart...',
      success: ({ missingProducts, added }) =>
        missingProducts.length
          ? `Added ${added} items, ${missingProducts.length} are unavailable.`
          : `Added ${added} items to your cart.`,
      error: 'Unable to reorder this order right now.',
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
      case 'delivered':
        return 'default'; // usually primary color (greenish or blueish)
      case 'shipped':
        return 'secondary';
      case 'cancelled':
      case 'refunded':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          <LocalizedText hu="Rendeléseim" en="Order History" />
        </h1>
        <p className="text-muted-foreground text-sm">
          <LocalizedText
            hu="Kövesse nyomon korábbi vásárlásait és azok státuszát."
            en="Review past purchases and track fulfillment status."
          />
        </p>
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
            <div className="flex items-center gap-3 text-muted-foreground py-8 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
              <LocalizedText hu="Rendelések betöltése..." en="Loading orders..." />
            </div>
          ) : null}

          {user && orders.length === 0 && !fetching && (
            <div className="rounded-lg border border-dashed border-border p-10 text-center space-y-4">
              <PackageOpen className="w-10 h-10 text-muted-foreground mx-auto" />
              <div>
                <p className="font-semibold">
                  <LocalizedText hu="Még nincs rendelése" en="No orders yet" />
                </p>
                <p className="text-sm text-muted-foreground">
                  <LocalizedText hu="Adjon le egy rendelést, hogy itt lássa." en="Place an order to see it listed here." />
                </p>
              </div>
              <Button asChild>
                <Link href="/products">
                  <LocalizedText hu="Vásárlás megkezdése" en="Start shopping" />
                </Link>
              </Button>
            </div>
          )}

          {user && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="rounded-xl border border-border p-5 bg-card hover:shadow-sm transition-shadow flex flex-col gap-4">
                  <div className="flex flex-wrap justify-between items-start gap-4 border-b border-border pb-4">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Order ID</p>
                      <p className="font-mono text-sm font-medium">{order.id.slice(0, 8)}...</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Placed</p>
                      <p className="text-sm font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
                      <p className="font-semibold text-base">${Number(order.total_amount).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusVariant(order.status)} className="capitalize">
                        {order.status}
                      </Badge>
                      <div className="flex items-center gap-2">
                        {(orderItemsMap[order.id] ?? []).slice(0, 3).map((item) => (
                          <span key={item.id} className="text-xs text-muted-foreground capitalize">
                            {item.products?.name ?? '—'}
                          </span>
                        ))}
                        {(orderItemsMap[order.id]?.length ?? 0) > 3 && (
                          <span className="text-xs text-muted-foreground">+{(orderItemsMap[order.id]?.length ?? 0) - 3}</span>
                        )}
                        {(orderItemsMap[order.id]?.length ?? 0) === 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            N/A
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-3 ml-auto">
                      <Button variant="outline" size="sm" onClick={() => handleReorder(order.id)}>
                        <RefreshCw className="w-3.5 h-3.5 mr-2" />
                        <LocalizedText hu="Újrarendelés" en="Reorder" />
                      </Button>
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/orders/${order.id}/confirmation`}>
                          <Eye className="w-3.5 h-3.5 mr-2" />
                          <LocalizedText hu="Részletek" en="Details" />
                        </Link>
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
  );
}
