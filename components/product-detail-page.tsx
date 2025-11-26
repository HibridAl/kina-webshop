'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getProductById, getSuppliers } from '@/lib/db';
import { useCart } from '@/hooks/use-cart';
import type { Product, Supplier } from '@/lib/types';
import { ShoppingCart, Zap, Package, TrendingUp } from 'lucide-react';

interface ProductDetailPageProps {
  productId: string;
  initialProduct?: Product | null;
}

export function ProductDetailPage({ productId, initialProduct }: ProductDetailPageProps) {
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(initialProduct ?? null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function loadData() {
      try {
        const [productData, suppliersData] = await Promise.all([
          getProductById(productId),
          getSuppliers(),
        ]);
        setProduct(productData);
        setSuppliers(suppliersData);
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [productId]);

  if (loading) return <Skeleton className="h-96" />;
  if (!product) return <div>Product not found</div>;

  const heroImage = product.image_url || '/placeholder.svg?height=400&width=500&query=automotive part';

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product.id, product.name, product.price, quantity, { imageUrl: heroImage });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            {/* Product Image */}
            <div className="flex items-center justify-center bg-muted rounded-lg h-96 md:h-full">
              <img
                src={heroImage}
                alt={product.name}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <p className="text-sm text-accent font-semibold mb-2">SKU: {product.sku}</p>
                <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
                <p className="text-lg text-muted-foreground">{product.description}</p>
              </div>

              {/* Price and Stock */}
              <div className="border-t border-b border-border py-6 space-y-4">
                <div className="flex items-baseline gap-4">
                  <div className="text-4xl font-bold text-accent">${product.price.toFixed(2)}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-green-500" />
                    <span className={product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                      {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
                    </span>
                  </div>
                </div>
              </div>

              {/* OEM Numbers */}
              {product.oem_numbers && product.oem_numbers.length > 0 && (
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">OEM Part Numbers</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.oem_numbers.map((oem, idx) => (
                      <span key={idx} className="bg-background px-3 py-1 rounded text-sm font-mono">
                        {oem}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Specifications</h3>
                  <div className="space-y-2">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add to Cart */}
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Quantity:</label>
                  <div className="flex items-center border border-border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 hover:bg-muted transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 text-center border-x border-border bg-background"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 hover:bg-muted transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleAddToCart}
                  size="lg"
                  disabled={product.stock_quantity === 0}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
              </div>

              {/* Product Features */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fast Shipping</p>
                    <p className="font-semibold">Worldwide</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Best Prices</p>
                    <p className="font-semibold">Guaranteed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Suppliers Section */}
          {suppliers.length > 0 && (
            <div className="border-t border-border pt-12">
              <h2 className="text-2xl font-bold mb-6">Available from Suppliers</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {suppliers.map((supplier) => (
                  <div key={supplier.id} className="p-6 bg-card border border-border rounded-lg">
                    <h3 className="font-semibold mb-2">{supplier.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Import Type: <span className="font-medium">{supplier.import_type}</span>
                    </p>
                    {supplier.last_synced && (
                      <p className="text-xs text-muted-foreground">
                        Last synced: {new Date(supplier.last_synced).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Products */}
          <div className="border-t border-border pt-12 mt-12">
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <p className="text-muted-foreground">
              Related products would appear here - linked by category, brand, or compatibility
            </p>
          </div>
    </div>
  );
}
