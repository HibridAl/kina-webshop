import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Metadata } from 'next';
import { BrandsGrid } from '@/components/brands-grid';

export const metadata: Metadata = {
  title: 'Brands - AutoHub | MG, BYD, Omoda, Geely, Haval',
  description: 'Browse all available car brands and find parts for your vehicle',
  openGraph: {
    title: 'Brands - AutoHub',
    description: 'Explore all available brands and select models',
  },
};

export default function BrandsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4 text-balance">All Brands</h1>
          <p className="text-lg text-muted-foreground mb-12">
            Select a brand to explore available models and find the perfect parts for your vehicle
          </p>

          <BrandsGrid />
        </div>
      </main>
      <Footer />
    </div>
  );
}
