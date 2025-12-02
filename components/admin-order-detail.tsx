'use client';

import { useEffect, useState, useTransition } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  getAdminOrderDetailsAction,
  updateOrderStatusAction,
  updatePaymentStatusAction,
  type AdminOrderDetails,
} from '@/app/admin/actions';

interface AdminOrderDetailProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated?: () => void;
}

export function AdminOrderDetail({
  orderId,
  open,
  onOpenChange,
  onOrderUpdated,
}: AdminOrderDetailProps) {
  const [order, setOrder] = useState<AdminOrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open && orderId) {
      setLoading(true);
      getAdminOrderDetailsAction(orderId)
        .then((data) => {
          setOrder(data);
        })
        .catch((err) => {
          console.error('Failed to fetch order details', err);
          toast.error('Failed to load order details');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setOrder(null);
    }
  }, [open, orderId]);

  const handleStatusChange = (newStatus: string) => {
    if (!order) return;
    startTransition(async () => {
      const result = await updateOrderStatusAction(order.id, newStatus);
      if (result.success) {
        toast.success('Order status updated');
        setOrder((prev) => (prev ? { ...prev, status: newStatus as any } : null));
        onOrderUpdated?.();
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    });
  };

    const handlePaymentStatusChange = (paymentId: string, newStatus: string) => {
    if (!order) return;
    startTransition(async () => {
      const result = await updatePaymentStatusAction(paymentId, newStatus);
      if (result.success) {
        toast.success('Payment status updated');
         // refresh full order to reflect payment changes correctly
         const updated = await getAdminOrderDetailsAction(order.id);
         if (updated) setOrder(updated);
         onOrderUpdated?.();
      } else {
        toast.error(result.error || 'Failed to update payment status');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            View and manage order information.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !order ? (
          <div className="py-8 text-center text-muted-foreground">
            Order not found.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Order ID</Label>
                <p className="font-medium">{order.id}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Date</Label>
                <p className="font-medium">
                  {format(new Date(order.created_at), 'PPP p')}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Customer</Label>
                {order.users ? (
                  <>
                    <p className="font-medium">{order.users.email || 'N/A'}</p>
                    {order.users.company_name && (
                      <p className="text-xs text-muted-foreground">{order.users.company_name}</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-medium">{order.guest_email || 'Guest'}</p>
                    {order.guest_name && (
                      <p className="text-xs text-muted-foreground">{order.guest_name}</p>
                    )}
                  </>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">Total Amount</Label>
                <p className="font-medium text-lg">
                  ${Number(order.total_amount).toFixed(2)}
                </p>
              </div>
            </div>

            <Separator />

            {/* Status Management */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label>Order Status</Label>
                    <Select
                        value={order.status}
                        onValueChange={handleStatusChange}
                        disabled={isPending}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

             <Separator />

            {/* Items */}
            <div>
              <h3 className="font-semibold mb-3">Order Items</h3>
              <div className="border rounded-md divide-y">
                {order.order_items.map((item) => (
                  <div key={item.id} className="p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {item.products?.image_url && (
                            <img src={item.products.image_url} alt={item.products.name} className="w-10 h-10 object-cover rounded bg-muted" />
                        )}
                        <div>
                            <p className="font-medium text-sm">{item.products?.name || 'Unknown Product'}</p>
                            <p className="text-xs text-muted-foreground">SKU: {item.products?.sku}</p>
                        </div>
                    </div>
                    <div className="text-right text-sm">
                      <p>{item.quantity} x ${Number(item.price_at_purchase).toFixed(2)}</p>
                      <p className="font-medium">
                        ${(item.quantity * Number(item.price_at_purchase)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />

             {/* Payments */}
             <div>
                 <h3 className="font-semibold mb-3">Payments</h3>
                 {order.order_payments.length === 0 ? (
                     <p className="text-sm text-muted-foreground">No payment records found.</p>
                 ) : (
                     <div className="space-y-3">
                         {order.order_payments.map((payment) => (
                             <div key={payment.id} className="border rounded-md p-3 flex justify-between items-center">
                                 <div>
                                     <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm capitalize">{payment.provider || 'Manual'} Payment</p>
                                         <Badge variant="outline">{payment.status}</Badge>
                                     </div>
                                     <p className="text-xs text-muted-foreground mt-1">ID: {payment.transaction_id || payment.id}</p>
                                     <p className="text-xs text-muted-foreground">{format(new Date(payment.created_at), 'PP p')}</p>
                                 </div>
                                 <div className="flex flex-col items-end gap-2">
                                     <p className="font-medium">${Number(payment.amount).toFixed(2)}</p>
                                     <Select
                                        value={payment.status}
                                        onValueChange={(val) => handlePaymentStatusChange(payment.id, val)}
                                        disabled={isPending}
                                     >
                                        <SelectTrigger className="h-7 w-[120px] text-xs">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="failed">Failed</SelectItem>
                                            <SelectItem value="refunded">Refunded</SelectItem>
                                        </SelectContent>
                                     </Select>
                                 </div>
                             </div>
                         ))}
                     </div>
                 )}
             </div>

            {/* Shipping Info */}
            {order.shipping_address && (
                <>
                    <Separator />
                    <div>
                        <h3 className="font-semibold mb-3">Shipping Address</h3>
                        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                            <pre className="font-sans whitespace-pre-wrap">
                                {JSON.stringify(order.shipping_address, null, 2)}
                            </pre>
                        </div>
                    </div>
                </>
            )}

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
