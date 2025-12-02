import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase-server';
import { requireAdmin } from '@/lib/admin-auth';

function parseUUID(param: string | null) {
  if (!param) return null;
  return /^[0-9a-f-]{36}$/i.test(param) ? param : null;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('errorResponse' in auth) return auth.errorResponse;
  const supabase = getServiceSupabase();
  const url = new URL(request.url);
  const brandId = parseUUID(url.searchParams.get('brand_id'));
  const categoryId = parseUUID(url.searchParams.get('category_id'));
  const fuelType = url.searchParams.get('fuel_type')?.trim() || null;

  try {
    const totalPromise = supabase
      .from('vehicles')
      .select('id, models!inner ( brand_id ), specifications', { count: 'exact', head: true })
      .match(fuelType ? { 'specifications->>fuel_type': fuelType } : {});

    const fitmentPromise = supabase
      .from('vehicle_product_compatibility')
      .select('vehicle_id, vehicles!inner(models!inner(brand_id))', { count: 'exact', head: true })
      .match(brandId ? { 'vehicles.models.brand_id': brandId } : {})
      .match(fuelType ? { 'vehicles.specifications->>fuel_type': fuelType } : {});

    const oilPromise = supabase
      .from('vehicle_oil_recommendations')
      .select('vehicle_id, vehicles!inner(models!inner(brand_id))', { count: 'exact', head: true })
      .match(brandId ? { 'vehicles.models.brand_id': brandId } : {})
      .match(fuelType ? { 'vehicles.specifications->>fuel_type': fuelType } : {});

    const [total, fitment, oil] = await Promise.all([totalPromise, fitmentPromise, oilPromise]);

    const totals = {
      vehicles: total.count ?? 0,
      with_fitment: fitment.count ?? 0,
      fitment_pct:
        total.count && fitment.count ? Number(((fitment.count / total.count) * 100).toFixed(1)) : 0,
      with_oil: oil.count ?? 0,
      oil_pct: total.count && oil.count ? Number(((oil.count / total.count) * 100).toFixed(1)) : 0,
    };

    const brandGaps = await supabase
      .from('vehicles')
      .select('models!inner(brand_id), id, specs:specifications')
      .match(fuelType ? { 'specifications->>fuel_type': fuelType } : {})
      .then(async ({ data }) => {
        const grouped: Record<string, { total: number; uncovered: number }> = {};
        for (const row of data ?? []) {
          const brand = row.models?.brand_id;
          if (!brand) continue;
          grouped[brand] = grouped[brand] || { total: 0, uncovered: 0 };
          grouped[brand].total += 1;
          if (!row.id) continue;
          const hasCompat = await supabase
            .from('vehicle_product_compatibility')
            .select('id', { count: 'exact', head: true })
            .eq('vehicle_id', row.id)
            .match(categoryId ? { 'products.category_id': categoryId } : {});
          if (!hasCompat.count) grouped[brand].uncovered += 1;
        }
        return grouped;
      });

    return NextResponse.json({ totals, filters: { brandId, categoryId, fuelType }, brand_gaps: brandGaps });
  } catch (error) {
    console.error('compatibility coverage error:', error);
    return NextResponse.json({ error: 'Unable to load coverage metrics' }, { status: 500 });
  }
}
