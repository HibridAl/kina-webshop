'use client';

import Link from 'next/link';
import { Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CartItemComponentProps {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

export function CartItemComponent({
  productId,
  name,
  price,
  quantity,
  onQuantityChange,
  onRemove,
}: CartItemComponentProps) {
  return (
    <div className="flex gap-4 py-4 border-b border-border last:border-b-0">
      {/* Product Info */}
      <div className="flex-1">
        <Link
          href={`/products/${productId}`}
          className="font-semibold hover:text-accent transition-colors"
        >
          {name}
        </Link>
        <p className="text-sm text-muted-foreground mt-1">${price.toFixed(2)} each</p>
      </div>

      {/* Quantity Control */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onQuantityChange(quantity - 1)}
          className="h-8 w-8 p-0"
        >
          <Minus className="w-4 h-4" />
        </Button>
        <span className="w-8 text-center font-semibold">{quantity}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onQuantityChange(quantity + 1)}
          className="h-8 w-8 p-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Price */}
      <div className="text-right min-w-24">
        <p className="font-bold">${(price * quantity).toFixed(2)}</p>
      </div>

      {/* Remove */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
