'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductFilters } from '@/components/product-filters';
import { ProductGrid } from '@/components/product-grid';
import { ProductsToolbar } from '@/components/products-toolbar';
import { ProductsPagination } from '@/components/products-pagination';
import {
  getBrandById,
  getCompatibleProducts,
  getModelById,
  getProductsByIds,
  getProductsPagedAndSorted,
  searchProductsByOem,
  getVehicleById,
} from '@/lib/db';
import type { Brand, Model, Product, Vehicle } from '@/lib/types';
import type { ProductSortOption } from '@/lib/db';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 12;

function createDefaultFilters() {
  return {
    search: '',
    oem: '',
    category: '',
    brand: '',
    model: '',
    vehicleId: '',
    priceRange: [0, 1000] as [number, number],
    inStock: false,
  };
}

function applyPriceAndStockFilters(
  items: Product[],
  priceRange: [number, number],
  inStock: boolean
) {
  return items.filter((item) => {
    const withinPrice =
      item.price >= priceRange[0] && item.price <= priceRange[1];
    const stockCheck = !inStock || item.stock_quantity > 0;
    return withinPrice && stockCheck;
  });
}

function sortProducts(list: Product[], sort: ProductSortOption) {
  const items = [...list];
  switch (sort) {
    case 'price-asc':
      return items.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return items.sort((a, b) => b.price - a.price);
    case 'popularity':
      return items.sort(
        (a, b) => (b.stock_quantity ?? 0) - (a.stock_quantity ?? 0)
      );
    case 'newest':
    default:
      return items.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }
}

export function ProductsPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [vehicleContext, setVehicleContext] = useState<{
    vehicle: Vehicle;
    model: Model | null;
    brand: Brand | null;
  } | null>(null);
  const [vehicleContextLoading, setVehicleContextLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<ProductSortOption>('newest');
  const [filters, setFilters] = useState(() => createDefaultFilters());

  // Initialize filters from URL query on first render or when params change
  useEffect(() => {
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';
    const model = searchParams.get('model') || '';
    const vehicleId = searchParams.get('vehicleId') || '';
    const oem = searchParams.get('oem') || '';
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const sortParam = (searchParams.get('sort') as ProductSortOption) || 'newest';

    setFilters((prev) => ({
      ...prev,
      search,
      oem,
      category,
      brand,
      model,
      vehicleId,
    }));
    setPage(Number.isNaN(pageParam) ? 1 : Math.max(1, pageParam));
    setSort(sortParam);
  }, [searchParams]);

  const applyFilters = useCallback(async () => {
    setLoading(true);
    try {
      let compatibleProductIds: string[] | undefined;

      if (filters.vehicleId) {
        const ids = await getCompatibleProducts(filters.vehicleId);
        compatibleProductIds = ids;
        if (ids.length === 0) {
          setProducts([]);
          setTotal(0);
          return;
        }
      }

      const commonFilters = {
        search: filters.search || undefined,
        category: filters.category || undefined,
        productIds: compatibleProductIds,
        inStock: filters.inStock,
        minPrice: filters.priceRange[0],
        maxPrice: filters.priceRange[1],
      };

      let fetched: Product[] = [];
      let count = 0;

      if (compatibleProductIds) {
        const matched = await getProductsByIds(compatibleProductIds);
        const filtered = applyPriceAndStockFilters(
          matched,
          filters.priceRange,
          filters.inStock
        );
        const sorted = sortProducts(filtered, sort);
        const start = Math.max(0, (page - 1) * PAGE_SIZE);
        const end = start + PAGE_SIZE;
        setProducts(sorted.slice(start, end));
        setTotal(filtered.length);
        return;
      }

      if (filters.oem) {
        fetched = await searchProductsByOem(filters.oem);
        const filtered = applyPriceAndStockFilters(
          fetched,
          filters.priceRange,
          filters.inStock
        );
        const sorted = sortProducts(filtered, sort);
        count = sorted.length;
        const start = Math.max(0, (page - 1) * PAGE_SIZE);
        const end = start + PAGE_SIZE;
        setProducts(sorted.slice(start, end));
        setTotal(count);
        return;
      } else {
        const { items, total } = await getProductsPagedAndSorted({
          page,
          limit: PAGE_SIZE,
          sort,
          filters: commonFilters,
        });
        fetched = items;
        count = total;
      }

      setProducts(fetched);
      setTotal(count);
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, page, sort]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    let active = true;
    async function loadVehicleContext() {
      if (!filters.vehicleId) {
        setVehicleContext(null);
        setVehicleContextLoading(false);
        return;
      }
      setVehicleContextLoading(true);
      try {
        const vehicle = await getVehicleById(filters.vehicleId);
        if (!vehicle) {
          if (active) setVehicleContext(null);
          return;
        }
        const model = vehicle.model_id ? await getModelById(vehicle.model_id) : null;
        const brand = model ? await getBrandById(model.brand_id) : null;
        if (active) {
          setVehicleContext({ vehicle, model, brand });
        }
      } catch (error) {
        console.error('Failed to load vehicle context', error);
      } finally {
        if (active) setVehicleContextLoading(false);
      }
    }

    loadVehicleContext();
    return () => {
      active = false;
    };
  }, [filters.vehicleId]);

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  }, []);

  const handleClearVehicle = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('vehicleId');
    params.delete('brand');
    params.delete('model');

    setFilters((prev) => ({
      ...prev,
      vehicleId: '',
      brand: '',
      model: '',
    }));

    router.push(params.toString() ? `?${params.toString()}` : '?');
  };

  const handleClearOem = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('oem');

    setFilters((prev) => ({
      ...prev,
      oem: '',
    }));

    router.push(params.toString() ? `?${params.toString()}` : '?');
  };

  const handleFiltersReset = () => {
    const params = new URLSearchParams(searchParams.toString());
    ['search', 'category', 'brand', 'model', 'vehicleId', 'oem', 'page'].forEach((key) =>
      params.delete(key)
    );
    setFilters(createDefaultFilters());
    setPage(1);
    router.push(params.toString() ? `?${params.toString()}` : '?');
  };

  const handleSortChange = (value: ProductSortOption) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    params.set('page', '1');
    setSort(value);
    setPage(1);
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(nextPage));
    setPage(nextPage);
    router.push(`?${params.toString()}`);
  };

  const totalPages = Math.max(1, Math.ceil((total || products.length) / PAGE_SIZE));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Filters Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-20">
          <ProductFilters
            onFilterChange={handleFilterChange}
            oemValue={filters.oem}
            onResetFilters={handleFiltersReset}
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="lg:col-span-3">
        {filters.vehicleId && (
          <div className="mb-6 rounded-lg border border-border bg-card p-4 space-y-3">
            {vehicleContextLoading && (
              <p className="text-sm text-muted-foreground">Loading vehicle details…</p>
            )}
            {!vehicleContextLoading && vehicleContext && (
              <>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Filtering by vehicle</p>
                  <p className="font-semibold">
                    {vehicleContext.brand?.name ? `${vehicleContext.brand.name} · ` : ''}
                    {vehicleContext.model?.name || 'Model'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {vehicleContext.vehicle.variant_name || vehicleContext.vehicle.engine_type}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/vehicles/${vehicleContext.vehicle.id}`}>View vehicle details</Link>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleClearVehicle}>
                    Clear vehicle filter
                  </Button>
                </div>
              </>
            )}
            {!vehicleContextLoading && !vehicleContext && (
              <p className="text-sm text-muted-foreground">
                Vehicle filter active. Unable to load details (vehicle may be missing).
                <button
                  type="button"
                  onClick={handleClearVehicle}
                  className="ml-2 underline"
                >
                  Clear filter
                </button>
              </p>
            )}
          </div>
        )}

        {filters.oem && (
          <div className="mb-6 rounded-lg border border-border bg-card p-4 space-y-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Filtering by OEM number</p>
              <p className="font-mono text-sm">{filters.oem}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="sm" variant="ghost" onClick={handleClearOem}>
                Clear OEM filter
              </Button>
            </div>
          </div>
        )}

        <ProductsToolbar
          page={page}
          pageSize={PAGE_SIZE}
          total={total || products.length}
          sort={sort}
          onSortChange={handleSortChange}
        />

        <ProductGrid products={products} loading={loading} />

        <div className="mt-6">
          <ProductsPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            isLoading={loading}
          />
        </div>
      </div>
    </div>
  );
}
