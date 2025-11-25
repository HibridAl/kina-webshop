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
        <div className="container mx-auto px-4 -mt-10 relative z-10 mb-12">
          <Suspense fallback={<div className="w-full h-[300px] bg-muted rounded-lg animate-pulse" />}>
            <VehicleSelector />
          </Suspense>
        </div>
        <FeaturedBrands />
        <CategoryShowcase />
      </main>
      <Footer />
    </div>
  );
}
