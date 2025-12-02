'use client';

import { useEffect, useState } from 'react';
import { Droplets, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocalizedText } from '@/components/ui/localized-text';
import { ProductGrid } from '@/components/product-grid';
import { mockProducts } from '@/lib/mock-data';
import type { Product } from '@/lib/types';

interface VehicleOilSelectorProps {
  vehicleId: string;
}

// Mock types until T-17.1 lands
interface OilRecommendation {
  type: 'engine' | 'transmission' | 'brake';
  label: string;
  spec: string;
  viscosity?: string;
  capacity?: string;
  products: Product[];
}

export function VehicleOilSelector({ vehicleId }: VehicleOilSelectorProps) {
  const [recommendations, setRecommendations] = useState<OilRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Mock logic: if vehicleId is odd/even, return different sets
      // In reality, this comes from T-17.2 backend
      setRecommendations([
        {
          type: 'engine',
          label: 'Engine Oil',
          spec: 'ACEA C3 / API SN',
          viscosity: '5W-30',
          capacity: '4.5L',
          products: mockProducts.slice(0, 2), // Mock matches
        },
        {
          type: 'transmission',
          label: 'Transmission Fluid',
          spec: 'OEM-Specific EV Gear Oil',
          capacity: '1.2L',
          products: [],
        }
      ]);
      setLoading(false);
    }
    load();
  }, [vehicleId]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded mb-2"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </CardHeader>
        <CardContent className="h-32 bg-muted/50"></CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Droplets className="h-5 w-5 text-blue-500" />
        <h2 className="text-xl font-semibold">
          <LocalizedText hu="Ajánlott folyadékok" en="Recommended Fluids" />
        </h2>
      </div>

      <div className="grid gap-6">
        {recommendations.map((rec, idx) => (
          <Card key={idx} className="overflow-hidden border-l-4 border-l-blue-500">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {rec.label}
                    {rec.viscosity && <Badge variant="secondary">{rec.viscosity}</Badge>}
                  </CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-green-600" />
                    {rec.spec}
                    {rec.capacity && <span className="text-xs px-2 py-0.5 bg-background border rounded-full">{rec.capacity} fill</span>}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {rec.products.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <LocalizedText hu="Kompatibilis termékek" en="Compatible Products" />
                  </p>
                  <ProductGrid products={rec.products} loading={false} />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                  <AlertCircle className="h-4 w-4" />
                  <LocalizedText 
                    hu="Jelenleg nincs készleten kompatibilis termék ehhez a specifikációhoz." 
                    en="No compatible products in stock for this specification." 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}