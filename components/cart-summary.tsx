'use client';

import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LocalizedText } from '@/components/ui/localized-text';

export function CartSummary() {
  const { total } = useCart();

  return (
    <div className="sticky top-24 bg-card border border-border/60 rounded-lg p-6 space-y-4 shadow-lg">
      <h3 className="font-semibold text-lg">
        <LocalizedText hu="Rendelési összegzés" en="Order Summary" />
      </h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            <LocalizedText hu="Részösszeg" en="Subtotal" />
          </span>
          <span>${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            <LocalizedText hu="Szállítás" en="Shipping" />
          </span>
          <span>TBD</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            <LocalizedText hu="Adó" en="Tax" />
          </span>
          <span>TBD</span>
        </div>
      </div>

      <div className="border-t border-border pt-4 flex justify-between font-bold text-lg">
        <span>
          <LocalizedText hu="Végösszeg" en="Total" />
        </span>
        <span className="text-accent">${total.toFixed(2)}</span>
      </div>

      <Button asChild size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-base font-semibold shadow-md">
        <Link href="/checkout">
          <LocalizedText hu="Tovább a fizetéshez" en="Proceed to Checkout" />
        </Link>
      </Button>

      <Button asChild variant="outline" className="w-full">
        <Link href="/products">
          <LocalizedText hu="Vásárlás folytatása" en="Continue Shopping" />
        </Link>
      </Button>
    </div>
  );
}
