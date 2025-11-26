import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { HeroSection } from '@/components/hero-section';
import { FeaturedBrands } from '@/components/featured-brands';
import { CategoryShowcase } from '@/components/category-showcase';
import { VehicleSelector } from '@/components/vehicle-selector';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { absoluteUrl, defaultOgImage, seoDefaults } from '@/lib/site-metadata';

export const metadata: Metadata = {
  title: 'AutoHub – EV Parts for MG, BYD, Omoda',
  description:
    'Factory-grade EV and hybrid components plus OEM lookup support for MG, BYD, Omoda, Geely, and Haval vehicles with fast delivery.',
  alternates: {
    canonical: absoluteUrl('/'),
  },
  openGraph: {
    type: 'website',
    siteName: seoDefaults.siteName,
    title: 'AutoHub – EV Parts for MG, BYD, Omoda',
    description:
      'Shop curated EV-ready components, fluids, and accessories backed by our vehicle selector and OEM search expertise.',
    url: absoluteUrl('/'),
    images: [
      {
        url: defaultOgImage(),
        width: 1200,
        height: 630,
        alt: 'AutoHub storefront hero with EV parts assortment',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoHub – EV Parts Marketplace',
    description: 'Compatible MG, BYD, and Omoda spares in one catalog.',
    images: [defaultOgImage()],
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />

        <section className="relative z-10 -mt-12 pb-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[32px] border border-border/70 bg-card/90 p-6 shadow-2xl sm:p-10">
              <div className="mb-6 flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Guided lookup</p>
                <h2 className="text-3xl font-semibold leading-tight text-balance md:text-4xl">
                  Start with your vehicle, finish with a ready-to-install kit.
                </h2>
                <p className="text-muted-foreground">
                  Plug in the exact MG, BYD, Omoda, Geely, or Haval trim. We’ll surface fitment-ready parts, OE equivalents, and compatible fluids instantly.
                </p>
              </div>
              <Suspense fallback={<div className="h-[320px] rounded-3xl bg-muted/70" />}>
                <VehicleSelector />
              </Suspense>
            </div>
          </div>
        </section>

        <FeaturedBrands />
        <CategoryShowcase />
      </main>
      <Footer />
    </div>
  );
}
