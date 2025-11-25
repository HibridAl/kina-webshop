'use client';

import Link from 'next/link';
import { ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/types';
import { useCart } from '@/hooks/use-cart';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const placeholder = '/placeholder.svg?height=300&width=400&query=automotive+part';
  const imageSrc =
    product.image_url && product.image_url.includes('/images/products/')
      ? placeholder
      : product.image_url || placeholder;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product.id, product.name, product.price, 1);
  };

  return (
    <Link href={`/products/${product.id}`}>
      <div className="group h-full bg-card border border-border rounded-lg overflow-hidden hover:border-accent hover:shadow-lg transition-all duration-300">
        {/* Image */}
        <div className="relative w-full h-48 bg-muted overflow-hidden">
          <img
            src={imageSrc}
            alt={product.name}
            onError={(e) => {
              if (e.currentTarget.src !== placeholder) {
                e.currentTarget.src = placeholder;
              }
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 right-2 bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-semibold">
            In Stock: {product.stock_quantity}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col h-56">
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-accent transition-colors">
            {product.name}
          </h3>

          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            SKU: {product.sku}
          </p>

          {product.oem_numbers && product.oem_numbers.length > 0 && (
            <p className="text-xs text-muted-foreground mb-3">
              OEM: {product.oem_numbers.join(', ')}
            </p>
          )}

          <div className="mt-auto space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-muted-foreground">(24 reviews)</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-2xl font-bold text-accent">
                ${product.price.toFixed(2)}
              </div>
              <Button
                onClick={handleAddToCart}
                size="sm"
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
