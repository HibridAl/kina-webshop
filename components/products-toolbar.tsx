import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProductSortOption } from '@/lib/db';

interface ProductsToolbarProps {
  page: number;
  pageSize: number;
  total: number;
  sort: ProductSortOption;
  onSortChange: (value: ProductSortOption) => void;
}

export function ProductsToolbar({ page, pageSize, total, sort, onSortChange }: ProductsToolbarProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(total, page * pageSize);

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-border/70 bg-card/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Showing {start}–{end} of {total} {total === 1 ? 'product' : 'products'}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline" className="rounded-full text-[11px] uppercase tracking-[0.3em]">
            Live inventory
          </Badge>
          <Badge variant="accent" className="rounded-full text-[11px]">
            Supabase synced
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center">
        <span className="text-muted-foreground">Sort</span>
        <Select value={sort} onValueChange={(value) => onSortChange(value as ProductSortOption)}>
          <SelectTrigger className="w-[200px] rounded-2xl border-border/70">
            <SelectValue placeholder="Select sort" />
          </SelectTrigger>
          <SelectContent side="bottom" className="rounded-2xl border-border/70">
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="popularity">Popularity</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
