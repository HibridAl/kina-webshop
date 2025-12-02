'use client';

import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AdminOrder } from '@/app/admin/actions';

interface AdminOrderListProps {
  orders: AdminOrder[];
  loading: boolean;
  onViewOrder: (order: AdminOrder) => void;
}

export function AdminOrderList({ orders, loading, onViewOrder }: AdminOrderListProps) {
  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">No orders found.</div>;
  }

  return (
    <div className="rounded-md border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="h-12 px-4 align-middle font-medium">Order ID</th>
              <th className="h-12 px-4 align-middle font-medium">Date</th>
              <th className="h-12 px-4 align-middle font-medium">Customer</th>
              <th className="h-12 px-4 align-middle font-medium">Status</th>
              <th className="h-12 px-4 align-middle font-medium">Payment</th>
              <th className="h-12 px-4 align-middle font-medium text-right">Total</th>
              <th className="h-12 px-4 align-middle font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                <td className="p-4 font-medium">{order.id.slice(0, 8)}...</td>
                <td className="p-4 text-muted-foreground">
                  {format(new Date(order.created_at), 'PP p')}
                </td>
                <td className="p-4">
                  <div className="flex flex-col">
                    {order.users ? (
                      <>
                        <span className="font-medium">
                          {order.users.email || 'Unknown User'}
                        </span>
                        {order.users.company_name && (
                          <span className="text-xs text-muted-foreground">
                            {order.users.company_name}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="font-medium">
                          {order.guest_email || 'Guest'}
                        </span>
                        {order.guest_name && (
                          <span className="text-xs text-muted-foreground">
                            {order.guest_name}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="p-4">
                  <PaymentStatusBadge status={order.payment_status || 'pending'} />
                </td>
                <td className="p-4 text-right font-medium">
                  ${Number(order.total_amount).toFixed(2)}
                </td>
                <td className="p-4 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewOrder(order)}
                    title="View Order"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
  switch (status) {
    case 'confirmed':
      variant = 'default'; // Blue-ish usually
      break;
    case 'shipped':
    case 'delivered':
    case 'completed':
      variant = 'outline'; // Green-ish usually, but outline is safe. Custom classes better.
      break;
    case 'cancelled':
      variant = 'destructive';
      break;
    case 'pending':
    default:
      variant = 'secondary';
      break;
  }

  // We can add custom colors via className if Badge supports it or if we wrap it.
  // For now, rely on variants.
  const colorClass = 
    status === 'completed' || status === 'delivered' ? 'bg-green-100 text-green-800 hover:bg-green-100/80 border-green-200' :
    status === 'shipped' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100/80 border-blue-200' :
    status === 'confirmed' ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100/80 border-indigo-200' :
    status === 'cancelled' ? 'bg-red-100 text-red-800 hover:bg-red-100/80 border-red-200' :
    '';

  return <Badge variant={variant} className={colorClass}>{status}</Badge>;
}

function PaymentStatusBadge({ status }: { status: string }) {
  const colorClass = 
    status === 'completed' || status === 'paid' ? 'text-green-600 border-green-200' :
    status === 'refunded' ? 'text-orange-600 border-orange-200' :
    status === 'failed' ? 'text-red-600 border-red-200' :
    'text-gray-500 border-gray-200';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${colorClass}`}>
      {status}
    </span>
  );
}
