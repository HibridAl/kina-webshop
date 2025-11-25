import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ModelDetail } from '@/components/model-detail';
import { getReadonlySupabase } from '@/lib/supabase-server';
import { absoluteUrl, defaultOgImage, seoDefaults } from '@/lib/site-metadata';

type ModelSummary = {
  id: string;
  name: string;
  year_start: number | null;
  year_end: number | null;
  brand_id: string;
  brands?: { id: string; name: string | null } | null;
};

async function fetchModelSummary(modelId: string): Promise<ModelSummary | null> {
  const client = getReadonlySupabase();
  if (!client) return null;
  const { data } = await client
    .from('models')
    .select('id,name,year_start,year_end,brand_id,brands(id,name)')
    .eq('id', modelId)
    .maybeSingle();
  return (data as ModelSummary) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; modelId: string }>;
}): Promise<Metadata> {
  const { id, modelId } = await params;
  const summary = await fetchModelSummary(modelId);
  const brandName = summary?.brands?.name ?? 'Brand';
  const modelName = summary?.name ?? 'Model';
  const years = summary?.year_start
    ? `${summary.year_start}${summary.year_end ? ` – ${summary.year_end}` : ' – present'}`
    : '';
  const title = `${brandName} ${modelName}${years ? ` ${years}` : ''} Parts – AutoHub`;
  const description = `Compatible parts, trims, and vehicles for the ${brandName} ${modelName}.`;
  const canonical = absoluteUrl(`/brands/${summary?.brand_id ?? id}/models/${modelId}`);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: seoDefaults.siteName,
      images: [
        {
          url: defaultOgImage(),
          width: 1200,
          height: 630,
          alt: `${brandName} ${modelName} compatibility overview`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [defaultOgImage()],
    },
  };
}

interface ModelPageProps {
  params: Promise<{ id: string; modelId: string }>;
}

export default async function ModelPage({ params }: ModelPageProps) {
  const { id, modelId } = await params;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <ModelDetail brandId={id} modelId={modelId} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
