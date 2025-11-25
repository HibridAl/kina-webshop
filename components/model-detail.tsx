'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProductGrid } from '@/components/product-grid';
import {
  getBrandById,
  getCompatibleProducts,
  getModelById,
  getProductsByIds,
  getVehiclesByModel,
} from '@/lib/db';
import type { Brand, Model, Vehicle, Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface ModelDetailProps {
  brandId: string;
  modelId: string;
}

export function ModelDetail({ brandId, modelId }: ModelDetailProps) {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [model, setModel] = useState<Model | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [brandData, modelData, vehiclesData] = await Promise.all([
          getBrandById(brandId),
          getModelById(modelId),
          getVehiclesByModel(modelId),
        ]);

        setBrand(brandData);
        setModel(modelData);
        setVehicles(vehiclesData);

        const compatByVehicle = await Promise.all(
          vehiclesData.map(async (vehicle) => {
            const ids = await getCompatibleProducts(vehicle.id);
            return { vehicle, productIds: ids };
          })
        );

        const aggregatedIds = Array.from(
          new Set(compatByVehicle.flatMap((entry) => entry.productIds))
        );
        if (aggregatedIds.length > 0) {
          const fetched = await getProductsByIds(aggregatedIds);
          setProducts(fetched);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error loading model detail:', error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [brandId, modelId]);

  if (loading) {
    return <Skeleton className="h-[400px]" />;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          <Link href="/brands" className="hover:underline">
            Brands
          </Link>{' '}
          /{' '}
          {brand && (
            <Link href={`/brands/${brand.id}`} className="hover:underline">
              {brand.name}
            </Link>
          )}{' '}
          / Models
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <h1 className="text-3xl font-bold">{model?.name ?? 'Model'}</h1>
          {model?.year_start && (
            <span className="text-sm text-muted-foreground">
              {model.year_start}
              {model.year_end ? ` – ${model.year_end}` : ' – present'}
            </span>
          )}
        </div>
        <p className="text-muted-foreground">
          Select a vehicle to explore trims, specs, and parts known to fit.
        </p>
      </div>

      {vehicles.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Vehicles</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {vehicles.map((vehicle) => {
              const specs = vehicle.specifications ?? {};
              const badge = [
                vehicle.engine_type,
                specs.battery,
                specs.power_kw ? `${specs.power_kw} kW` : undefined,
              ]
                .filter(Boolean)
                .join(' • ');
              return (
                <li key={vehicle.id} className="rounded-lg border border-border p-4 space-y-3">
                  <div>
                    <div className="font-semibold text-lg">
                      {vehicle.variant_name || vehicle.engine_type || 'Vehicle'}
                    </div>
                    {badge && <div className="text-sm text-muted-foreground">{badge}</div>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm">
                      <Link href={`/vehicles/${vehicle.id}`}>Vehicle details</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/products?vehicleId=${vehicle.id}`}>View compatible parts</Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No vehicles found for this model.</p>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Compatible Products</h2>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No compatibility data available for these vehicles yet.
          </p>
        ) : (
          <ProductGrid products={products} loading={false} />
        )}
      </div>
    </div>
  );
}
