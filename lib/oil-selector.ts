import { getBrowserClient } from './supabase';

export interface OilRecommendation {
  id: string;
  vehicle_id: string;
  manufacturer_label: string;
  viscosity: string;
  specification_code: string | null;
  product_sku: string | null;
}

export async function getOilRecommendations(vehicleId: string) {
  try {
    const client = getBrowserClient();
    const { data, error } = await client
      .from('vehicle_oil_recommendations')
      .select('*')
      .eq('vehicle_id', vehicleId);
    if (error) throw error;
    return (data as OilRecommendation[]) ?? [];
  } catch (error) {
    console.error('Failed to load oil recommendations:', error);
    return [];
  }
}
