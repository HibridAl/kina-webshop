'use client';

import { useState, useEffect } from 'react';
import { getCategories, getBrands } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Category, Brand } from '@/lib/types';
import { Filter, Search } from 'lucide-react';

interface ProductFiltersProps {
  onFilterChange: (filters: {
    search: string;
    category: string;
    brand: string;
    priceRange: [number, number];
    inStock: boolean;
  }) => void;
  oemValue?: string;
  onResetFilters?: () => void;
}

export function ProductFilters({ onFilterChange, oemValue, onResetFilters }: ProductFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [inStock, setInStock] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadFilters() {
      try {
        const [catsData, brandsData] = await Promise.all([getCategories(), getBrands()]);
        setCategories(catsData);
        setBrands(brandsData);
      } catch (error) {
        console.error('Error loading filters:', error);
      }
    }

    loadFilters();
  }, []);

  useEffect(() => {
    onFilterChange({
      search: searchQuery,
      category: selectedCategory,
      brand: selectedBrand,
      priceRange,
      inStock,
    });
  }, [searchQuery, selectedCategory, selectedBrand, priceRange, inStock, onFilterChange]);

  const badgeChips = [
    selectedCategory && {
      label: categories.find((cat) => cat.id === selectedCategory)?.name ?? 'Category',
      type: 'category' as const,
    },
    selectedBrand && {
      label: brands.find((brand) => brand.id === selectedBrand)?.name ?? 'Brand',
      type: 'brand' as const,
    },
    inStock && { label: 'In stock only', type: 'stock' as const },
  ].filter(Boolean) as { label: string; type: 'category' | 'brand' | 'stock' }[];

  return (
    <aside className="space-y-6 rounded-[32px] border border-border/70 bg-card/80 p-6 shadow-lg">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Filter className="h-4 w-4" />
        Refine catalog
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Search</p>
        <Input
          type="text"
          placeholder="Search products, SKU, OEM"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={Boolean(oemValue)}
          className="mt-2 rounded-2xl"
          leadingIcon={<Search className="h-4 w-4" />}
        />
        {oemValue && (
          <p className="mt-2 text-xs text-muted-foreground">
            Filtering by OEM (<span className="font-mono text-foreground">{oemValue}</span>). Clear the OEM filter to re-enable search.
          </p>
        )}
      </div>

      {badgeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badgeChips.map((chip) => (
            <Badge key={chip.type} variant="outline" className="rounded-full">
              {chip.label}
            </Badge>
          ))}
        </div>
      )}

      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Category</p>
        <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto pr-1">
          <Button
            variant={selectedCategory === '' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('')}
            className="justify-start rounded-2xl text-sm"
          >
            All categories
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'ghost'}
              onClick={() => setSelectedCategory(cat.id)}
              className="justify-start rounded-2xl text-sm"
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Brand</p>
        <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto pr-1">
          <Button
            variant={selectedBrand === '' ? 'default' : 'outline'}
            onClick={() => setSelectedBrand('')}
            className="justify-start rounded-2xl text-sm"
          >
            All brands
          </Button>
          {brands.map((brand) => (
            <Button
              key={brand.id}
              variant={selectedBrand === brand.id ? 'default' : 'ghost'}
              onClick={() => setSelectedBrand(brand.id)}
              className="justify-start rounded-2xl text-sm"
            >
              {brand.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Price range</p>
        <div>
          <label className="text-xs text-muted-foreground">Min: ${priceRange[0]}</label>
          <input
            type="range"
            min="0"
            max="1000"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([parseInt(e.target.value, 10), priceRange[1]])}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Max: ${priceRange[1]}</label>
          <input
            type="range"
            min="0"
            max="1000"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value, 10)])}
            className="w-full"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border"
          checked={inStock}
          onChange={(e) => setInStock(e.target.checked)}
        />
        In stock only
      </label>

      <Button
        onClick={() => {
          setSelectedCategory('');
          setSelectedBrand('');
          setPriceRange([0, 1000]);
          setInStock(false);
          setSearchQuery('');
          onResetFilters?.();
        }}
        variant="outline"
        className="w-full rounded-2xl"
      >
        Reset filters
      </Button>
    </aside>
  );
}
