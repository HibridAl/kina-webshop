import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ProductsPageClient } from '@/components/products-page-client';
import { VehicleSelector } from '@/components/vehicle-selector';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { absoluteUrl, defaultOgImage, seoDefaults } from '@/lib/site-metadata';

export const metadata: Metadata = {
  title: 'AutoHub Catalog – OEM Lookup & Vehicle Selector',
  description:
    'Browse every AutoHub part category with OEM number search, VIN-friendly filters, and a guided vehicle selector for MG, BYD, and Omoda fleets.',
  alternates: {
    canonical: absoluteUrl('/products'),
  },
  openGraph: {
    type: 'website',
    siteName: seoDefaults.siteName,
    title: 'AutoHub Catalog – OEM Lookup & Vehicle Selector',
    description:
      'Search OEM references, filter by compatible vehicles, and unlock curated MG, BYD, and Omoda part bundles.',
    url: absoluteUrl('/products'),
    images: [
      {
        url: defaultOgImage(),
        width: 1200,
        height: 630,
        alt: 'AutoHub catalog grid with OEM lookup and vehicle selector UI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoHub Product Catalog',
    description: 'Complete MG, BYD, Omoda parts library with OEM search.',
    images: [defaultOgImage()],
  },
};

export default function ProductsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-background via-primary/5 to-accent/10 py-16">
          <div className="absolute inset-0 bg-grid-soft opacity-20" aria-hidden />
          <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Universal catalog</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">Products Catalog</h1>
            <p className="mx-auto mt-4 max-w-3xl text-base text-muted-foreground">
              A single pane of glass for MG, BYD, Omoda, Geely, and Haval SKUs—with OEM crosswalks, inventory telemetry, and the guided vehicle selector baked in.
            </p>
          </div>
        </section>

        <section className="-mt-10 pb-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[32px] border border-border/60 bg-card/90 p-6 shadow-2xl">
              <Suspense fallback={<div>Loading vehicle selector...</div>}>
                <VehicleSelector />
              </Suspense>
            </div>
          </div>
        </section>

        <section className="pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Suspense fallback={<div>Loading products...</div>}>
              <ProductsPageClient />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
