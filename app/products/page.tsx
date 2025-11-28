import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ProductsPageClient } from '@/components/products-page-client';
import { VehicleSelector } from '@/components/vehicle-selector';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { absoluteUrl, defaultOgImage, seoDefaults } from '@/lib/site-metadata';
import { LocalizedText } from '@/components/ui/localized-text';

export const metadata: Metadata = {
  title: 'Katalógus – OEM Keresés & Járműválasztó | AutoHub',
  description:
    'Keressen MG, BYD, Omoda, Geely és Haval cikkszámokra, szűrjön VIN-barát feltételekkel, és használja a vezetett járműválasztót flottavásárlóként vagy szervizpartnerként.',
  alternates: {
    canonical: absoluteUrl('/products'),
  },
  openGraph: {
    type: 'website',
    siteName: seoDefaults.siteName,
    title: 'Katalógus – OEM Keresés & Járműválasztó',
    description:
      'OEM hivatkozások keresése, kompatibilis járművek szerinti szűrés és gondosan összeállított EV szervizkészletek egyetlen termékkatalógusban.',
    url: absoluteUrl('/products'),
    images: [
      {
        url: defaultOgImage(),
        width: 1200,
        height: 630,
        alt: 'AutoHub termékkatalógus',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Katalógus – OEM Keresés & Járműválasztó',
    description:
      'Teljes MG, BYD, Omoda, Geely és Haval alkatrészkatalógus OEM kereséssel és jármű kompatibilitási szűrőkkel magyar nyelven.',
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
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
              <LocalizedText hu="Univerzális katalógus" en="Universal catalog" />
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
              <LocalizedText hu="Termékkatalógus" en="Products Catalog" />
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-base text-muted-foreground">
              <LocalizedText
                hu="Egyetlen felületen érheti el az MG, BYD, Omoda, Geely és Haval cikkszámokat – OEM keresztekkel, készlet-telemetriával és beépített járműválasztóval."
                en="A single pane of glass for MG, BYD, Omoda, Geely, and Haval SKUs—with OEM crosswalks, inventory telemetry, and the guided vehicle selector baked in."
              />
            </p>
          </div>
        </section>

        <section className="-mt-10 pb-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[32px] border border-border/60 bg-card/90 p-6 shadow-2xl">
              <Suspense
                fallback={
                  <div className="py-20 text-center text-sm text-muted-foreground">
                    <LocalizedText hu="Járműválasztó betöltése…" en="Loading vehicle selector..." />
                  </div>
                }
              >
                <VehicleSelector />
              </Suspense>
            </div>
          </div>
        </section>

        <section className="pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Suspense
              fallback={
                <div className="py-20 text-center text-sm text-muted-foreground">
                  <LocalizedText hu="Termékek betöltése…" en="Loading products..." />
                </div>
              }
            >
              <ProductsPageClient />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
