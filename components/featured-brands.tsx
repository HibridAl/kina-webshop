'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getBrands } from '@/lib/db';
import type { Brand } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { LocalizedText } from '@/components/ui/localized-text';

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
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" aria-hidden />
      <div className="absolute inset-0 bg-grid-soft opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 pb-10 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
              <LocalizedText hu="Megbízható OEM partnerek" en="Trusted OEM partners" />
            </p>
            <h2 className="text-3xl font-semibold leading-tight md:text-4xl">
              <LocalizedText
                hu="Ellenőrzött készletek Kína vezető EV-gyártóitól közvetlenül."
                en="Verified inventory direct from China’s flagship EV makers."
              />
            </h2>
            <p className="text-muted-foreground md:w-3/4">
              <LocalizedText
                hu="Minden márkakártya élő Supabase táblákra épül, SKU-eredettel, fenntarthatósági mutatókkal és piacokra bontott elérhetőségi megjegyzésekkel."
                en="Every brand tile pipes into live Supabase tables with SKU provenance, sustainability metrics, and readiness notes per market."
              />
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge variant="outline" className="rounded-full px-4 py-2">
              <LocalizedText hu="Szén-semleges csomagolás" en="Carbon-neutral packaging" />
            </Badge>
            <Badge className="rounded-full px-4 py-2">
              <LocalizedText hu="OEM dokumentáció mellékelve" en="OEM docs attached" />
            </Badge>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {brands.slice(0, 4).map((brand) => (
              <Link
                key={brand.id}
                href={`/brands/${brand.id}`}
                className="group rounded-[28px] border border-border/70 bg-card/70 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-6 flex items-center justify-between">
                  {getBrandLogo(brand) ? (
                    <img
                      src={getBrandLogo(brand) || '/placeholder.svg'}
                      alt={brand.name}
                      className="h-10 w-10 object-contain"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold">
                      {brand.name.substring(0, 2)}
                    </div>
                  )}
                  <Badge variant="outline" className="rounded-full text-[11px]">
                    {brand.country ?? 'Global'}
                  </Badge>
                </div>
                <h3 className="text-xl font-semibold">{brand.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                  {brand.description ?? (
                    <LocalizedText
                      hu="EV hajtáslánc, futómű, karosszéria és elektronikai programok."
                      en="EV drivetrain, suspension, body, and electronics programs."
                    />
                  )}
                </p>
                <div className="mt-6 flex items-center justify-between text-sm text-primary">
                  <LocalizedText hu="Modellkínálat megtekintése" en="Browse lineup" />
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && brands.length > 0 && (
          <div className="mt-12 overflow-hidden rounded-2xl border border-border/60 bg-card/60">
            <div className="flex min-w-full gap-10 p-6 animate-marquee" aria-hidden>
              {[...brands, ...brands].map((brand, index) => (
                <div key={`${brand.id}-${index}`} className="flex items-center gap-3 text-sm text-muted-foreground">
                  {getBrandLogo(brand) ? (
                    <img src={getBrandLogo(brand) || '/placeholder.svg'} alt={brand.name} className="h-6 w-6 object-contain" />
                  ) : (
                    <span className="text-xs font-semibold text-foreground">{brand.name.substring(0, 2)}</span>
                  )}
                  <span>{brand.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
