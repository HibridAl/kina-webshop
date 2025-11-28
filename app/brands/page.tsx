import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Metadata } from 'next';
import { BrandsGrid } from '@/components/brands-grid';
import { LocalizedText } from '@/components/ui/localized-text';

export const metadata: Metadata = {
  title: 'Márkák – AutoHub | MG, BYD, Omoda, Geely, Haval',
  description:
    'Böngéssze az összes elérhető autómárkát, és találja meg a járművéhez vagy flottájához legjobban illő EV és hibrid alkatrészeket.',
  openGraph: {
    title: 'Márkák – AutoHub',
    description:
      'Fedezze fel a támogatott márkákat, válasszon modellt, és nézze meg a hozzá tartozó kompatibilis alkatrészeket és szervizkészleteket.',
  },
};

export default function BrandsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4 text-balance">
            <LocalizedText hu="Összes márka" en="All Brands" />
          </h1>
          <p className="text-lg text-muted-foreground mb-12">
            <LocalizedText
              hu="Válasszon egy márkát, hogy felfedezze a hozzá tartozó modelleket, és megtalálja a járművéhez tökéletesen illeszkedő alkatrészeket."
              en="Select a brand to explore available models and find the perfect parts for your vehicle"
            />
          </p>

          <BrandsGrid />
        </div>
      </main>
      <Footer />
    </div>
  );
}
