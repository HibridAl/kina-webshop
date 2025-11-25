'use client';

import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export function CartSummary() {
  const { total, itemCount } = useCart();

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <h3 className="font-semibold text-lg">Order Summary</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span>TBD</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax</span>
          <span>TBD</span>
        </div>
      </div>

      <div className="border-t border-border pt-4 flex justify-between font-bold text-lg">
        <span>Total</span>
        <span className="text-accent">${total.toFixed(2)}</span>
      </div>

      <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
        <Link href="/checkout">
          Proceed to Checkout
        </Link>
      </Button>

      <Button asChild variant="outline" className="w-full">
        <Link href="/products">
          Continue Shopping
        </Link>
      </Button>
    </div>
  );
}
