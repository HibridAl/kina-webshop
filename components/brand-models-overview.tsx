'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrandById, getModels } from '@/lib/db';
import type { Brand, Model } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface BrandModelsOverviewProps {
  brandId: string;
}

export function BrandModelsOverview({ brandId }: BrandModelsOverviewProps) {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [brandData, modelsData] = await Promise.all([
          getBrandById(brandId),
          getModels(brandId),
        ]);
        if (!active) return;
        setBrand(brandData);
        setModels(modelsData);
      } catch (error) {
        console.error('Failed to load brand models', error);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [brandId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
        Brand not found.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Brand</p>
        <h1 className="text-4xl font-bold">{brand.name}</h1>
        <p className="text-muted-foreground max-w-2xl">
          Choose a model below to drill down into trims, vehicles, and compatible parts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((model) => (
          <div key={model.id} className="border border-border rounded-lg p-6 space-y-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Model</p>
              <h2 className="text-2xl font-semibold">{model.name}</h2>
              {model.year_start && (
                <p className="text-sm text-muted-foreground">
                  {model.year_start}
                  {model.year_end ? ` – ${model.year_end}` : ' – present'}
                </p>
              )}
            </div>
            {model.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">{model.description}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button asChild size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href={`/brands/${brandId}/models/${model.id}`}>View vehicles</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/products?model=${model.id}`}>View compatible parts</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
