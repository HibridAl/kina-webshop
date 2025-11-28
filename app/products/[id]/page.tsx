import type { Metadata } from 'next';
import Script from 'next/script';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ProductDetailPage } from '@/components/product-detail-page';
import { getReadonlySupabase } from '@/lib/supabase-server';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import { absoluteUrl, defaultOgImage, seoDefaults } from '@/lib/site-metadata';
import { mockCategories, mockProducts } from '@/lib/mock-data';

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
  const fallback = getMockProduct(id);
  const client = getReadonlySupabase();
  if (!client) return fallback;
  const { data }: PostgrestSingleResponse<ProductSummary> = await client
    .from('products')
    .select('id,name,description,price,stock_quantity,sku,categories(name)')
    .eq('id', id)
    .maybeSingle();
  return data ?? fallback;
}

function getMockProduct(id: string): ProductSummary | null {
  const product = mockProducts.find((mock) => mock.id === id);
  if (!product) return null;
  const category = mockCategories.find((cat) => cat.id === product.category_id);
  return {
    id: product.id,
    name: product.name,
    description: product.description ?? null,
    price: product.price ?? null,
    stock_quantity: product.stock_quantity ?? null,
    sku: product.sku,
    categories: category ? { name: category.name } : null,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const summary = await fetchProductSummary(id);
  const title = summary ? `${summary.name} – AutoHub EV alkatrész` : 'Termék részletei – AutoHub';
  const description =
    summary?.description ||
    'Eredeti és minőségi utángyártott alkatrészek MG, BYD, Omoda, Geely és Haval modellekhez, OEM cikkszám alapú kereséssel.';

  const canonical = absoluteUrl(`/products/${id}`);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'product',
      siteName: seoDefaults.siteName,
      images: [
        {
          url: defaultOgImage(),
          width: 1200,
          height: 630,
          alt: summary?.name ? `${summary.name} termékfotó` : 'AutoHub terméklista',
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
    : {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: `AutoHub termék ${id}`,
        sku: id,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: '0.00',
          availability: 'https://schema.org/OutOfStock',
          url: absoluteUrl(`/products/${id}`),
        },
      };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 md:py-16">
        {jsonLd && (
          <Script
            id={`product-jsonld-${summary ? summary.id : id}`}
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
