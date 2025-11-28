import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { VehicleDetail } from '@/components/vehicle-detail';
import { getReadonlySupabase } from '@/lib/supabase-server';
import { absoluteUrl, defaultOgImage, seoDefaults } from '@/lib/site-metadata';
import { mockBrands, mockModels, mockVehicles } from '@/lib/mock-data';

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

function getMockVehicleSummary(id: string): VehicleSummary | null {
  const vehicle = mockVehicles.find((mock) => mock.id === id);
  if (!vehicle) return null;
  const model = mockModels.find((mock) => mock.id === vehicle.model_id);
  const brand = model ? mockBrands.find((mock) => mock.id === model.brand_id) : null;

  return {
    id: vehicle.id,
    variant_name: vehicle.variant_name,
    engine_type: vehicle.engine_type,
    model_id: vehicle.model_id,
    models: model
      ? {
          id: model.id,
          name: model.name,
          year_start: model.year_start,
          year_end: model.year_end,
          brand_id: model.brand_id,
          brands: brand ? { id: brand.id, name: brand.name } : null,
        }
      : null,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const summary = (await fetchVehicleSummary(id)) ?? getMockVehicleSummary(id);
  const brandName = summary?.models?.brands?.name ?? 'Ismeretlen márka';
  const modelName = summary?.models?.name ?? 'Ismeretlen modell';
  const vehicleName = summary?.variant_name || summary?.engine_type || 'Ismeretlen kivitel';
  const title = `${brandName} ${modelName} ${vehicleName} – kompatibilis alkatrészek és műszaki adatok`;
  const description = `Műszaki adatok és kompatibilis alkatrészek a(z) ${brandName} ${modelName} ${vehicleName} modellhez – bevizsgált EV és hibrid komponensek flottáknak és szervizeknek.`;
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
          alt: `${brandName} ${modelName} ${vehicleName} alkatrész-kínálat`,
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
