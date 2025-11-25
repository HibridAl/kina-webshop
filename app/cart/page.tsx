'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CartItemComponent } from '@/components/cart-item';
import { CartSummary } from '@/components/cart-summary';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

export default function CartPage() {
  const { items, updateQuantity, removeItem, loaded } = useCart();

  if (!loaded) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div>Loading cart...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6">
            <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
            <div>
              <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">Start shopping to add items to your cart</p>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/products">Browse Products</Link>
              </Button>
            </div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="font-semibold text-lg mb-4">Items in Cart ({items.length})</h2>
                <div>
                  {items.map((item) => (
                    <CartItemComponent
                      key={item.productId}
                      productId={item.productId}
                      name={item.name}
                      price={item.price}
                      quantity={item.quantity}
                      onQuantityChange={(qty) => updateQuantity(item.productId, qty)}
                      onRemove={() => removeItem(item.productId)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <CartSummary />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
