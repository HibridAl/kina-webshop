'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ProductGrid } from '@/components/product-grid';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  getBrandById,
  getCompatibleProducts,
  getModelById,
  getProductsByIds,
  getVehicleById,
} from '@/lib/db';
import type { Brand, Model, Product, Vehicle } from '@/lib/types';
import { LocalizedText } from '@/components/ui/localized-text';

interface VehicleDetailProps {
  vehicleId: string;
}

export function VehicleDetail({ vehicleId }: VehicleDetailProps) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [model, setModel] = useState<Model | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [compatibleIds, setCompatibleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const vehicleData = await getVehicleById(vehicleId);
        setVehicle(vehicleData);

        if (!vehicleData) {
          setCompatibleIds([]);
          setProducts([]);
          return;
        }

        const [modelData, compat] = await Promise.all([
          getModelById(vehicleData.model_id),
          getCompatibleProducts(vehicleData.id),
        ]);
        setModel(modelData);

        if (modelData) {
          const brandData = await getBrandById(modelData.brand_id);
          setBrand(brandData);
        } else {
          setBrand(null);
        }
        setCompatibleIds(compat);

        if (compat.length > 0) {
          const fetched = await getProductsByIds(compat);
          setProducts(fetched);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error loading vehicle detail:', error);
        setCompatibleIds([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [vehicleId]);

  const specEntries = useMemo(() => {
    if (!vehicle?.specifications) return [];
    return Object.entries(vehicle.specifications);
  }, [vehicle]);

  if (loading) {
    return <Skeleton className="h-[420px]" />;
  }

  if (!vehicle) {
    return (
      <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">
        <LocalizedText
          hu="A jármű nem található. Lépjen vissza az előző oldalra, és válasszon egy másik modellt."
          en="Vehicle not found. Please return to the previous page and choose another model."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {brand && (
            <>
              <Link href={`/brands/${brand.id}`} className="hover:underline">
                {brand.name}
              </Link>
              {' / '}
            </>
          )}
          {model && (
            <Link href={`/brands/${model.brand_id}/models/${model.id}`} className="hover:underline">
              {model.name}
            </Link>
          )}{' '}
          <LocalizedText hu="/ Jármű" en="/ Vehicle" />
        </p>
        <h1 className="text-3xl font-bold">
          {vehicle.variant_name || vehicle.engine_type || 'Vehicle'}
        </h1>
        <p className="text-muted-foreground">
          {[vehicle.engine_type, vehicle.transmission].filter(Boolean).join(' • ')}
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild size="sm">
            <Link href={`/products?vehicleId=${vehicle.id}`}>
              <LocalizedText hu="Kompatibilis alkatrészek megtekintése" en="Shop compatible parts" />
            </Link>
          </Button>
          {model && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/brands/${model.brand_id}/models/${model.id}`}>
                <LocalizedText hu="Vissza a modellhez" en="Back to model" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {specEntries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {specEntries.map(([key, value]) => (
            <div key={key} className="rounded-lg border border-border p-4">
              <div className="text-xs uppercase text-muted-foreground mb-1">{key}</div>
              <div className="font-medium">{String(value)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">
            <LocalizedText hu="Kompatibilis termékek" en="Compatible Products" />
          </h2>
          {compatibleIds.length > 0 && (
            <span className="text-sm text-muted-foreground">
              <LocalizedText
                hu={`${compatibleIds.length} egyezés`}
                en={`${compatibleIds.length} matches`}
              />
            </span>
          )}
        </div>
        {compatibleIds.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            <LocalizedText
              hu="Ehhez a járműhöz még nincs kompatibilitási adatunk. Próbáljon ki egy másik modellt, vagy vegye fel a kapcsolatot csapatunkkal segítségért."
              en="We don’t have compatibility data for this vehicle yet. Try selecting another model or contact our team for assistance."
            />
          </p>
        ) : (
          <ProductGrid products={products} loading={false} />
        )}
      </div>
    </div>
  );
}
