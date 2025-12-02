'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocalizedText } from '@/components/ui/localized-text';
import { ProductGrid } from '@/components/product-grid';
import { mockProducts } from '@/lib/mock-data'; // Mock data for now
import type { Product } from '@/lib/types';

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching wishlist items from an API
    const fetchWishlist = async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      // Just return some mock products for the demo
      setWishlistItems(mockProducts.slice(0, 4));
      setLoading(false);
    };

    fetchWishlist();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">
          <LocalizedText hu="Kívánságlista betöltése..." en="Loading wishlist..." />
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary fill-current" />
          <LocalizedText hu="Kívánságlista" en="My Wishlist" />
        </h1>
        <p className="text-muted-foreground text-sm">
          <LocalizedText
            hu="Mentett termékek, amiket később szeretne megvásárolni."
            en="Saved items you want to buy later."
          />
        </p>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <Heart className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">
            <LocalizedText hu="Üres a kívánságlistája" en="Your wishlist is empty" />
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            <LocalizedText
              hu="Böngésszen a katalógusban és mentse el a kedvenceit."
              en="Browse the catalog and save your favorites here."
            />
          </p>
          <Button asChild className="mt-6">
            <Link href="/products">
              <LocalizedText hu="Böngészés" en="Start Browsing" />
            </Link>
          </Button>
        </div>
      ) : (
        <ProductGrid products={wishlistItems} loading={false} />
      )}
    </div>
  );
}
