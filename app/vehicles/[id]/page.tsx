import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { VehicleDetail } from '@/components/vehicle-detail';
import { getReadonlySupabase } from '@/lib/supabase-server';
import { absoluteUrl, defaultOgImage, seoDefaults } from '@/lib/site-metadata';

type VehicleSummary = {
  id: string;
  variant_name: string | null;
  engine_type: string | null;
  model_id: string;
  models?: {
    id: string;
    name: string | null;
    year_start: number | null;
    year_end: number | null;
    brand_id: string;
    brands?: { id: string; name: string | null } | null;
  } | null;
};

async function fetchVehicleSummary(id: string): Promise<VehicleSummary | null> {
  const client = getReadonlySupabase();
  if (!client) return null;
  const { data } = await client
    .from('vehicles')
    .select('id,variant_name,engine_type,model_id,models(id,name,year_start,year_end,brand_id,brands(id,name))')
    .eq('id', id)
    .maybeSingle();
  return (data as VehicleSummary) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const summary = await fetchVehicleSummary(id);
  const brandName = summary?.models?.brands?.name ?? 'Brand';
  const modelName = summary?.models?.name ?? 'Model';
  const vehicleName = summary?.variant_name || summary?.engine_type || 'Vehicle';
  const title = `${brandName} ${modelName} ${vehicleName} – Compatible Parts`;
  const description = `Specifications and compatible parts for the ${brandName} ${modelName} ${vehicleName}.`;
  const canonical = absoluteUrl(`/vehicles/${id}`);
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
          alt: `${brandName} ${modelName} ${vehicleName} parts hero`,
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

interface VehiclePageProps {
  params: Promise<{ id: string }>;
}

export default async function VehiclePage({ params }: VehiclePageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <VehicleDetail vehicleId={id} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
