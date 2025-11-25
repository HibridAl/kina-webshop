import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BrandDetail } from '@/components/brand-detail';
import { getReadonlySupabase } from '@/lib/supabase-server';
import { absoluteUrl, defaultOgImage, seoDefaults } from '@/lib/site-metadata';

type BrandSummary = { id: string; name: string; description: string | null; country: string | null };

async function fetchBrand(id: string): Promise<BrandSummary | null> {
  const client = getReadonlySupabase();
  if (!client) return null;
  const { data } = await client
    .from('brands')
    .select('id,name,description,country')
    .eq('id', id)
    .maybeSingle();
  return (data as BrandSummary) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const brand = await fetchBrand(id);
  const title = brand ? `${brand.name} Parts & Accessories – AutoHub` : 'Brand Details – AutoHub';
  const description = brand?.description || `Browse authentic parts and accessories for ${brand?.name ?? 'this brand'}.`;
  const canonical = absoluteUrl(`/brands/${id}`);
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
          alt: `${brand?.name ?? 'AutoHub brand'} parts overview`,
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

export default async function BrandDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <BrandDetail brandId={id} />
      </main>
      <Footer />
    </div>
  );
}
