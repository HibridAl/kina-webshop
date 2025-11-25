'use client';

import { useState, useEffect, useCallback } from 'react';
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

    async function load() {
      setLoaded(false);
      if (user && supabaseReady) {
        try {
          const stored = readLocalCart();
          if (stored.length) {
            await Promise.all(
              stored.map((line) =>
                addToCartRemote(user.id, line.productId, line.quantity, {
                  price: line.price,
                  name: line.name,
                })
              )
            );
            writeLocalCart([]);
          }

          const remote = await getCartItems(user.id);
          if (!cancelled) {
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
        setItems(local);
        setLoaded(true);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user, supabaseReady]);

  useEffect(() => {
    if (loaded && (!user || !supabaseReady)) {
      writeLocalCart(items);
    }
  }, [items, loaded, user, supabaseReady]);

  const addItem = useCallback(
    async (productId: string, name: string, price: number, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((item) => item.productId === productId);
        if (existing) {
          return prev.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prev, { productId, name, price, quantity }];
      });

      if (user && supabaseReady) {
        try {
          await addToCartRemote(user.id, productId, quantity, { price, name });
        } catch (err) {
          console.error('Error adding to remote cart:', err);
        }
      }
    },
    [user, supabaseReady]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      setItems((prev) => prev.filter((item) => item.productId !== productId));

      if (user && supabaseReady) {
        try {
          await removeFromCartRemote(user.id, productId);
        } catch (err) {
          console.error('Error removing from remote cart:', err);
        }
      }
    },
    [user, supabaseReady]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }

      setItems((prev) =>
        prev.map((item) => (item.productId === productId ? { ...item, quantity } : item))
      );

      if (user && supabaseReady) {
        try {
          await updateCartItemQuantity(user.id, productId, quantity);
        } catch (err) {
          console.error('Error updating remote cart quantity:', err);
        }
      }
    },
    [removeItem, supabaseReady, user]
  );

  const clearCart = useCallback(async () => {
    setItems([]);

    if (user && supabaseReady) {
      try {
        await clearCartItems(user.id);
      } catch (err) {
        console.error('Error clearing remote cart:', err);
      }
    } else {
      writeLocalCart([]);
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
