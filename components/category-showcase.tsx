'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Package, Wrench, Zap, Wind, Lightbulb } from 'lucide-react';
import { getCategories } from '@/lib/db';
import type { Category } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { LocalizedText } from '@/components/ui/localized-text';

const categoryIcons: Record<string, ReactNode> = {
  'Maintenance & Fluids': <Package className="h-6 w-6" />,
  Brakes: <Wrench className="h-6 w-6" />,
  Electrical: <Zap className="h-6 w-6" />,
  'Air & Fuel': <Wind className="h-6 w-6" />,
  Lighting: <Lightbulb className="h-6 w-6" />,
};

const gradients = [
  'from-[#EDF7FF] to-[#F4EEFF]',
  'from-[#F1FFF5] to-[#EEF9FF]',
  'from-[#FFF5F3] to-[#FFEFE8]',
  'from-[#F4F4FF] to-[#ECF4FF]',
  'from-[#FFF6FB] to-[#FFEFF7]',
  'from-[#EDF9FF] to-[#F5F4FF]',
];

export function CategoryShowcase() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getCategories();
        setCategories(data.slice(0, 6));
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, []);

  return (
    <section className="relative py-20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
              <LocalizedText hu="Böngészés rendszerenként" en="Browse by system" />
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">
              <LocalizedText hu="Merüljön el bármelyik járműrendszerben két kattintással." en="Drill into a subsystem in two taps." />
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              <LocalizedText
                hu="A gondosan összeállított csomagok érzékelőket, kábelkorbácsokat, szervizkészleteket és fogyóanyagokat kapcsolnak össze járműéletszakaszok szerint – így végtelen szűrőkapcsolgatás helyett kész útvonalakat használhat."
                en="These curated stacks merge sensors, harnesses, service kits, and consumables per vehicle stage. Use them as shortcuts instead of endless filter toggles."
              />
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary"
          >
            <LocalizedText hu="Teljes katalógus megtekintése" en="See full catalog" />
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className={`group relative overflow-hidden rounded-[28px] border border-transparent bg-gradient-to-br ${gradients[index % gradients.length]} p-6 text-foreground shadow-sm transition hover:-translate-y-1 hover:shadow-xl`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-primary">
                    {categoryIcons[category.name] || <Package className="h-6 w-6" />}
                  </div>
                  <Badge variant="outline" className="rounded-full bg-white/80 text-xs">
                    {index + 1}
                  </Badge>
                </div>
                <div className="mt-6 space-y-2">
                  <h3 className="text-xl font-semibold">{category.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {category.description ?? (
                      <LocalizedText
                        hu="OEM és minőségi utángyártott alkatrészek keveréke, a mi kompatibilitási gráfunk alapján validálva."
                        en="Mix of OEM and aftermarket components validated against our compatibility graph."
                      />
                    )}
                  </p>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  <LocalizedText hu="Részletek megtekintése" en="Dive in" />
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
