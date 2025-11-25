'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCategories } from '@/lib/db';
import type { Category } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Wrench, Zap, Wind, Lightbulb } from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  'Maintenance & Fluids': <Package className="w-8 h-8" />,
  'Brakes': <Wrench className="w-8 h-8" />,
  'Electrical': <Zap className="w-8 h-8" />,
  'Air & Fuel': <Wind className="w-8 h-8" />,
  'Lighting': <Lightbulb className="w-8 h-8" />,
};

export function CategoryShowcase() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getCategories();
        setCategories(data.slice(0, 6)); // Show first 6 categories
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, []);

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Shop by Category</h2>
          <p className="text-lg text-muted-foreground">
            Find exactly what you need for your vehicle
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="group"
              >
                <div className="relative overflow-hidden rounded-lg bg-card border border-border hover:border-accent transition-all p-6 h-48 flex flex-col items-center justify-center hover:shadow-lg">
                  <div className="text-accent mb-4">
                    {categoryIcons[category.name] || <Package className="w-8 h-8" />}
                  </div>
                  <h3 className="font-semibold text-center mb-2 group-hover:text-accent transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-xs text-muted-foreground text-center">
                    {category.description || 'Browse this category'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link href="/products" className="text-accent font-semibold hover:underline">
            View All Categories →
          </Link>
        </div>
      </div>
    </section>
  );
}
