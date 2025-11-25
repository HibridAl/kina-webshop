import type { Metadata } from 'next';
import Script from 'next/script';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ProductDetailPage } from '@/components/product-detail-page';
import { getReadonlySupabase } from '@/lib/supabase-server';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import { absoluteUrl, defaultOgImage, seoDefaults } from '@/lib/site-metadata';

type ProductSummary = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  stock_quantity: number | null;
  sku: string;
  categories?: { name: string | null } | null;
};

async function fetchProductSummary(id: string): Promise<ProductSummary | null> {
  const client = getReadonlySupabase();
  if (!client) return null;
  const { data }: PostgrestSingleResponse<ProductSummary> = await client
    .from('products')
    .select('id,name,description,price,stock_quantity,sku,categories(name)')
    .eq('id', id)
    .maybeSingle();
  return data ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const summary = await fetchProductSummary(id);
  const title = summary ? `${summary.name} – AutoHub` : 'Product Details – AutoHub';
  const description = summary?.description ||
    'Explore authentic spare parts and accessories for MG, BYD, Omoda, Geely, and Haval vehicles.';

  const canonical = absoluteUrl(`/products/${id}`);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      siteName: seoDefaults.siteName,
      images: [
        {
          url: defaultOgImage(),
          width: 1200,
          height: 630,
          alt: summary?.name ? `${summary.name} product hero` : 'AutoHub product listing',
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

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const summary = await fetchProductSummary(id);

  const jsonLd = summary
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: summary.name,
        description: summary.description,
        sku: summary.sku,
        brand: {
          '@type': 'Brand',
          name: summary.categories?.name || 'AutoHub',
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: Number(summary.price ?? 0).toFixed(2),
          availability:
            summary.stock_quantity && summary.stock_quantity > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          url: absoluteUrl(`/products/${summary.id}`),
        },
      }
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 md:py-16">
        {jsonLd && (
          <Script
            id={`product-jsonld-${summary.id}`}
            type="application/ld+json"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}
        <ProductDetailPage productId={id} initialProduct={summary} />
      </main>
      <Footer />
    </div>
  );
}
