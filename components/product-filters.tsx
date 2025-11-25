'use client';

import { useState, useEffect } from 'react';
import { getCategories, getBrands } from '@/lib/db';
import { Button } from '@/components/ui/button';
import type { Category, Brand } from '@/lib/types';
import { ChevronDown } from 'lucide-react';

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
        const [catsData, brandsData] = await Promise.all([
          getCategories(),
          getBrands(),
        ]);
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

  return (
    <div className="space-y-6 p-6 bg-card border border-border rounded-lg">
      <div>
        <h3 className="font-semibold mb-3">Search</h3>
        <input
          type="text"
          placeholder="Search products, SKU, OEM..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={Boolean(oemValue)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        />
        {oemValue && (
          <p className="mt-2 text-xs text-muted-foreground">
            Filtering by OEM currently (
            <span className="font-mono text-foreground">{oemValue}</span>). Text search is disabled until
            you clear the OEM filter.
          </p>
        )}
      </div>

      {oemValue && (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs uppercase text-muted-foreground mb-1">OEM filter</p>
          <p className="font-mono text-sm mb-1">{oemValue}</p>
          <p className="text-xs text-muted-foreground">Reset filters to remove this OEM constraint.</p>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-3">Category</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <Button
            variant={selectedCategory === '' ? 'default' : 'ghost'}
            onClick={() => setSelectedCategory('')}
            className="w-full justify-start text-sm"
          >
            All Categories
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'ghost'}
              onClick={() => setSelectedCategory(cat.id)}
              className="w-full justify-start text-sm"
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Brand</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <Button
            variant={selectedBrand === '' ? 'default' : 'ghost'}
            onClick={() => setSelectedBrand('')}
            className="w-full justify-start text-sm"
          >
            All Brands
          </Button>
          {brands.map((brand) => (
            <Button
              key={brand.id}
              variant={selectedBrand === brand.id ? 'default' : 'ghost'}
              onClick={() => setSelectedBrand(brand.id)}
              className="w-full justify-start text-sm"
            >
              {brand.name}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Price Range</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">
              Min: ${priceRange[0]}
            </label>
            <input
              type="range"
              min="0"
              max="1000"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              Max: ${priceRange[1]}
            </label>
            <input
              type="range"
              min="0"
              max="1000"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="inStock"
          checked={inStock}
          onChange={(e) => setInStock(e.target.checked)}
          className="w-4 h-4 rounded"
        />
        <label htmlFor="inStock" className="text-sm cursor-pointer">
          In Stock Only
        </label>
      </div>

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
        className="w-full"
      >
        Reset Filters
      </Button>
    </div>
  );
}
