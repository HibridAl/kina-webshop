'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  addToCart as addToCartRemote,
  getCartItems,
  removeFromCart as removeFromCartRemote,
  updateCartItemQuantity,
  clearCartItems,
} from '@/lib/db';
import type { CartItem as CartRow } from '@/lib/types';
import { useAuth } from './use-auth';

interface CartLine {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  imageUrl?: string | null;
}

interface AddItemOptions {
  imageUrl?: string | null;
}

const CART_STORAGE_KEY = 'autohub-cart';

function readLocalCart(): CartLine[] {
  try {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(CART_STORAGE_KEY) : null;
    return stored ? (JSON.parse(stored) as CartLine[]) : [];
  } catch (error) {
    console.error('Error parsing cart storage', error);
    return [];
  }
}

function writeLocalCart(lines: CartLine[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  } catch (error) {
    console.error('Error writing cart storage', error);
  }
}

function mapRemoteCartItem(entry: CartRow): CartLine {
  const fallbackName = entry.products?.name ?? entry.name_snapshot ?? 'Product';
  const fallbackPrice = entry.price_at_add ?? entry.products?.price ?? 0;
  return {
    productId: entry.product_id,
    quantity: entry.quantity,
    price: Number(fallbackPrice) || 0,
    name: fallbackName,
    imageUrl: entry.products?.image_url ?? null,
  };
}

export function useCart() {
  const { user } = useAuth();
  const [items, setItems] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const supabaseReady =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    let cancelled = false;
    console.log('useCart useEffect triggered. User:', user?.id, 'Supabase Ready:', supabaseReady);

    async function load() {
      setLoaded(false);
      if (user && supabaseReady) {
        console.log('Loading remote cart for user:', user.id);
        try {
          const stored = readLocalCart();
          if (stored.length) {
            console.log('Migrating local cart to remote:', stored);
            await Promise.all(
              stored.map((line) =>
                addToCartRemote(user.id, line.productId, line.quantity, {
                  price: line.price,
                  name: line.name,
                })
              )
            );
            writeLocalCart([]);
            console.log('Local cart migrated and cleared.');
          }

          const remote = await getCartItems(user.id);
          if (!cancelled) {
            console.log('Remote cart items fetched:', remote);
            setItems(remote.map(mapRemoteCartItem));
            setLoaded(true);
          }
          return;
        } catch (err) {
          console.error('Error loading remote cart:', err);
        }
      }

      const local = readLocalCart();
      if (!cancelled) {
        console.log('Loading local cart:', local);
        setItems(local);
        setLoaded(true);
      }
    }

    load();

    return () => {
      cancelled = true;
      console.log('useCart useEffect cleanup.');
    };
  }, [user, supabaseReady]);

  useEffect(() => {
    if (loaded && (!user || !supabaseReady)) {
      console.log('Persisting cart to local storage:', items);
      writeLocalCart(items);
    }
  }, [items, loaded, user, supabaseReady]);

  const addItem = useCallback(
    async (productId: string, name: string, price: number, quantity = 1, options?: AddItemOptions) => {
      console.log('Adding item:', productId, name, quantity);
      setItems((prev) => {
        const existing = prev.find((item) => item.productId === productId);
        let next: CartLine[];
        if (existing) {
          next = prev.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          next = [...prev, { productId, name, price, quantity, imageUrl: options?.imageUrl ?? null }];
        }

        if (!user || !supabaseReady) {
          writeLocalCart(next);
          console.log('Added to local cart. New local cart:', next);
        }

        return next;
      });

      toast.success('Added to cart', {
        description: `${name} ×${quantity}`,
      });

      if (user && supabaseReady) {
        try {
          console.log('Adding to remote cart for user:', user.id, 'product:', productId, 'quantity:', quantity);
          await addToCartRemote(user.id, productId, quantity, { price, name });
          console.log('Item added to remote cart successfully.');
        } catch (err) {
          console.error('Error adding to remote cart:', err);
          toast.error('Unable to sync cart', {
            description: 'Please try again in a moment.',
          });
        }
      }
    },
    [supabaseReady, user]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      console.log('Removing item:', productId);
      setItems((prev) => {
        const next = prev.filter((item) => item.productId !== productId);
        if (!user || !supabaseReady) {
          writeLocalCart(next);
          console.log('Removed from local cart. New local cart:', next);
        }
        return next;
      });

      if (user && supabaseReady) {
        try {
          await removeFromCartRemote(user.id, productId);
          console.log('Item removed from remote cart successfully.');
        } catch (err) {
          console.error('Error removing from remote cart:', err);
        }
      }
    },
    [user, supabaseReady]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      console.log('Updating quantity for item:', productId, 'to:', quantity);
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }

      setItems((prev) => {
        const next = prev.map((item) => (item.productId === productId ? { ...item, quantity } : item));
        if (!user || !supabaseReady) {
          writeLocalCart(next);
          console.log('Updated local cart quantity. New local cart:', next);
        }
        return next;
      });

      if (user && supabaseReady) {
        try {
          await updateCartItemQuantity(user.id, productId, quantity);
          console.log('Quantity updated in remote cart successfully.');
        } catch (err) {
          console.error('Error updating remote cart quantity:', err);
        }
      }
    },
    [removeItem, supabaseReady, user]
  );

  const clearCart = useCallback(async () => {
    console.log('Clearing cart.');
    setItems([]);

    if (user && supabaseReady) {
      try {
        await clearCartItems(user.id);
        console.log('Remote cart cleared successfully.');
      } catch (err) {
        console.error('Error clearing remote cart:', err);
      }
    } else {
      writeLocalCart([]);
      console.log('Local cart cleared.');
    }
  }, [supabaseReady, user]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    itemCount: items.reduce((acc, line) => acc + line.quantity, 0),
    loaded,
  };
}
