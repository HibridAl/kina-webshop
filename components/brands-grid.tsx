'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrands } from '@/lib/db';
import type { Brand } from '@/lib/types';
import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { LocalizedText } from '@/components/ui/localized-text';

export function BrandsGrid() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getBrands();
        setBrands(data);
      } catch (error) {
        console.error('Error loading brands:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-48" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {brands.map((brand) => (
        <article
          key={brand.id}
          className="p-8 bg-card border border-border rounded-lg hover:border-accent transition-all hover:shadow-lg flex flex-col gap-4"
        >
          <div>
            {brand.logo_url && (
              <img
                src={brand.logo_url || '/placeholder.svg'}
                alt={brand.name}
                className="w-24 h-24 object-contain mb-4"
              />
            )}
            <h2 className="text-2xl font-bold mb-2">
              {brand.name}
            </h2>
            {brand.country && (
              <p className="text-sm text-muted-foreground mb-2">{brand.country}</p>
            )}
            {brand.description && (
              <p className="text-sm text-muted-foreground mb-4">{brand.description}</p>
            )}
            <div className="flex items-center text-accent font-semibold text-sm">
              <LocalizedText hu="Márkaáttekintés" en="Brand overview" /> <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="secondary" size="sm">
              <Link href={`/brands/${brand.id}`}>
                <LocalizedText hu="Márkaösszefoglaló" en="Brand summary" />
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href={`/brands/${brand.id}/models`}>
                <LocalizedText hu="Modellek böngészése" en="Browse models" />
              </Link>
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
