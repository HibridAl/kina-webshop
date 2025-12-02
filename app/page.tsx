import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { HeroSection } from '@/components/hero-section';
import { FeaturedBrands } from '@/components/featured-brands';
import { CategoryShowcase } from '@/components/category-showcase';
import { VehicleSelector } from '@/components/vehicle-selector';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { absoluteUrl, defaultOgImage, seoDefaults } from '@/lib/site-metadata';
import { LocalizedText } from '@/components/ui/localized-text';

export const metadata: Metadata = {
  title: 'AutoHub – Prémium EV Alkatrészek & OEM Kereső | MG, BYD, Omoda, Geely',
  description:
    'Gyári minőségű elektromos és hibrid autóalkatrészek MG, BYD, Omoda, Geely és Haval modellekhez, OEM cikkszám alapú kereséssel és gyors európai kiszállítással flottáknak és szervizeknek.',
  alternates: {
    canonical: absoluteUrl('/'),
  },
  openGraph: {
    type: 'website',
    siteName: seoDefaults.siteName,
    title: 'AutoHub – Prémium EV Alkatrészek & OEM Kereső',
    description:
      'Válogatott EV-kész alkatrészek, folyadékok és kiegészítők MG, BYD, Omoda, Geely és Haval modellekhez, beépített járműválasztóval és OEM keresővel flottakezelőknek és szervizeknek.',
    url: absoluteUrl('/'),
    images: [
      {
        url: defaultOgImage(),
        width: 1200,
        height: 630,
        alt: 'AutoHub EV alkatrész piactér',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AutoHub – Prémium EV Alkatrészek & OEM Kereső',
    description: 'Kompatibilis MG, BYD, Omoda, Geely és Haval alkatrészek egyetlen magyar nyelvű EV katalógusban, OEM kereséssel.',
    images: [defaultOgImage()],
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={<div className="h-16 bg-background border-b border-border" />}>
        <Header />
      </Suspense>
      <main className="flex-1">
        <HeroSection />

        <section className="relative z-10 -mt-12 pb-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[32px] border border-border/70 bg-card/90 p-6 shadow-2xl sm:p-10">
              <div className="mb-6 flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  <LocalizedText hu="Vezetett keresés" en="Guided lookup" />
                </p>
                <h2 className="text-3xl font-semibold leading-tight text-balance md:text-4xl">
                  <LocalizedText
                    hu="Indítson a járművel, fejezze be egy készre konfigurált szervizkészlettel."
                    en="Start with your vehicle, finish with a ready-to-install kit."
                  />
                </h2>
                <p className="text-muted-foreground">
                  <LocalizedText
                    hu="Adja meg pontos MG, BYD, Omoda, Geely vagy Haval kivitelét – mi pedig azonnal listázzuk a beépítésre kész, gyári előírásnak megfelelő alkatrészeket, OE-egyenértékeket és kompatibilis folyadékokat."
                    en="Plug in the exact MG, BYD, Omoda, Geely, or Haval trim. We’ll surface fitment-ready parts, OE equivalents, and compatible fluids instantly."
                  />
                </p>
              </div>
              <Suspense
                fallback={
                  <div className="flex h-[320px] items-center justify-center rounded-3xl bg-muted/70 text-sm text-muted-foreground">
                    <LocalizedText hu="Járműválasztó betöltése…" en="Loading vehicle selector..." />
                  </div>
                }
              >
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
