import type { ProductSortOption } from '@/lib/db';

interface ProductsToolbarProps {
  page: number;
  pageSize: number;
  total: number;
  sort: ProductSortOption;
  onSortChange: (value: ProductSortOption) => void;
}

export function ProductsToolbar({
  page,
  pageSize,
  total,
  sort,
  onSortChange,
}: ProductsToolbarProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(total, page * pageSize);

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {total} {total === 1 ? 'product' : 'products'}
      </p>

      <div className="flex items-center gap-3 text-sm">
        <label className="text-muted-foreground" htmlFor="products-sort">
          Sort
        </label>
        <select
          id="products-sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as ProductSortOption)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="popularity">Popularity</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>
    </div>
  );
}
