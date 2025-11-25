'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrandById, getModels } from '@/lib/db';
import type { Brand, Model } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight } from 'lucide-react';

const brandLogoMap: Record<string, string> = {
  MG: '/CarBrands/mg.png',
  BYD: '/CarBrands/byd.png',
  Omoda: '/CarBrands/omoda.svg',
  Geely: '/CarBrands/geely.png',
  Haval: '/CarBrands/haval.png',
};

function getBrandLogo(brand: Brand | null): string | null {
  if (!brand) return null;
  const mapped = brandLogoMap[brand.name];
  if (mapped) return mapped;
  if (brand.logo_url) return brand.logo_url;
  return null;
}

export function BrandDetail({ brandId }: { brandId: string }) {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [brandData, modelsData] = await Promise.all([
          getBrandById(brandId),
          getModels(brandId),
        ]);
        setBrand(brandData);
        setModels(modelsData);
      } catch (error) {
        console.error('Error loading brand:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [brandId]);

  if (loading) return <Skeleton className="h-96" />;
  if (!brand) return <div>Brand not found</div>;

  return (
    <div className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand Header */}
        <div className="mb-12 space-y-6">
          <div className="flex items-center gap-4 mb-6">
            {getBrandLogo(brand) && (
              <img
                src={getBrandLogo(brand) || "/placeholder.svg"}
                alt={brand.name}
                className="w-20 h-20 object-contain"
              />
            )}
            <div>
              <h1 className="text-4xl font-bold mb-2">{brand.name}</h1>
              {brand.country && <p className="text-muted-foreground">{brand.country}</p>}
            </div>
          </div>
          {brand.description && (
            <p className="text-lg text-muted-foreground max-w-2xl">{brand.description}</p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button asChild size="sm">
              <Link href={`/brands/${brandId}/models`}>View all models</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/brands/${brandId}`}>Brand overview</Link>
            </Button>
          </div>
        </div>

        {/* Models */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Available Models</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map((model) => (
              <Link
                key={model.id}
                href={`/brands/${brandId}/models/${model.id}`}
                className="group"
              >
                <div className="p-6 bg-card border border-border rounded-lg hover:border-accent transition-all hover:shadow-lg">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-accent transition-colors">
                    {model.name}
                  </h3>
                  {model.year_start && model.year_end && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {model.year_start} - {model.year_end}
                    </p>
                  )}
                  {model.description && (
                    <p className="text-sm text-muted-foreground mb-4">{model.description}</p>
                  )}
                  <div className="flex items-center text-accent font-semibold text-sm">
                    Browse <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
