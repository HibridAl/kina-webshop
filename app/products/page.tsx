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
      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">Products Catalog</h1>
          <p className="text-muted-foreground mb-8">
            Browse our complete catalog of automotive parts and accessories
          </p>

          <div className="mb-8">
            <Suspense fallback={<div>Loading vehicle selector...</div>}>
              <VehicleSelector />
            </Suspense>
          </div>

          <Suspense fallback={<div>Loading products...</div>}>
            <ProductsPageClient />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
