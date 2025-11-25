'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrands } from '@/lib/db';
import type { Brand } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const brandLogoMap: Record<string, string> = {
  MG: '/CarBrands/mg.png',
  BYD: '/CarBrands/byd.png',
  Omoda: '/CarBrands/omoda.svg',
  Geely: '/CarBrands/geely.png',
  Haval: '/CarBrands/haval.png',
};

function getBrandLogo(brand: Brand): string | null {
  const mapped = brandLogoMap[brand.name];
  if (mapped) return mapped;
  if (brand.logo_url) return brand.logo_url;
  return null;
}

export function FeaturedBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBrands() {
      try {
        const data = await getBrands();
        setBrands(data);
      } catch (error) {
        console.error('Error loading brands:', error);
      } finally {
        setLoading(false);
      }
    }

    loadBrands();
  }, []);

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Featured Brands</h2>
          <p className="text-lg text-muted-foreground">
            Explore parts and accessories for the top Chinese automotive brands
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/brands/${brand.id}`}
                className="group"
              >
                <div className="relative overflow-hidden rounded-lg bg-card border border-border hover:border-accent transition-all h-40 flex flex-col items-center justify-center p-4">
                  {getBrandLogo(brand) ? (
                    <img
                      src={getBrandLogo(brand) || "/placeholder.svg"}
                      alt={brand.name}
                      className="w-16 h-16 object-contain mb-3 group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-accent rounded-lg flex items-center justify-center mb-3 text-accent-foreground font-bold text-xl">
                      {brand.name.substring(0, 2)}
                    </div>
                  )}
                  <h3 className="font-semibold text-center group-hover:text-accent transition-colors">
                    {brand.name}
                  </h3>
                  {brand.country && (
                    <p className="text-xs text-muted-foreground mt-1">{brand.country}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
