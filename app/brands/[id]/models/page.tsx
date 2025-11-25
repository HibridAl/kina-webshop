import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BrandModelsOverview } from '@/components/brand-models-overview';

interface BrandModelsPageProps {
  params: Promise<{ id: string }>;
}

export default async function BrandModelsPage({ params }: BrandModelsPageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BrandModelsOverview brandId={id} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
