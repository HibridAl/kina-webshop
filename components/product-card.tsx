'use client';

import Link from 'next/link';
import { ShoppingCart, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/types';
import { useCart } from '@/hooks/use-cart';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const placeholder = '/placeholder.svg?height=320&width=480&text=AutoHub+part';
  const imageSrc =
    product.image_url && product.image_url.includes('/images/products/')
      ? placeholder
      : product.image_url || placeholder;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product.id, product.name, product.price, 1, { imageUrl: imageSrc });
  };

  const primaryOem = product.oem_numbers?.[0];

  return (
    <Link href={`/products/${product.id}`} className="group h-full">
      <article className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-border/70 bg-card/80 p-4 shadow-sm transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl">
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-muted">
          <img
            src={imageSrc}
            alt={product.name}
            onError={(e) => {
              if (e.currentTarget.src !== placeholder) {
                e.currentTarget.src = placeholder;
              }
            }}
            className="h-48 w-full rounded-2xl object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs font-semibold text-foreground">
            In stock: {product.stock_quantity}
          </div>
          <div className="absolute right-4 top-4">
            <Badge variant="accent" className="rounded-full text-[10px]">
              Ready to ship
            </Badge>
          </div>
        </div>

        <div className="mt-5 flex flex-1 flex-col">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono text-[11px] uppercase tracking-widest">SKU · {product.sku}</span>
            {primaryOem && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">OEM {primaryOem}</span>}
          </div>
          <h3 className="mt-3 text-lg font-semibold leading-tight text-balance group-hover:text-primary">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
          )}

          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            QC + warranty ready
          </div>

          <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Starting at</p>
              <p className="text-2xl font-semibold text-primary">${product.price.toFixed(2)}</p>
            </div>
            <Button
              onClick={handleAddToCart}
              size="sm"
              className="w-full rounded-full bg-primary text-primary-foreground sm:w-auto"
            >
              <ShoppingCart className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </article>
    </Link>
  );
}
