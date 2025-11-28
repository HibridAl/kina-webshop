'use client';

import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProductSortOption } from '@/lib/db';
import { useLocale } from '@/hooks/use-locale';

interface ProductsToolbarProps {
  page: number;
  pageSize: number;
  total: number;
  sort: ProductSortOption;
  onSortChange: (value: ProductSortOption) => void;
}

export function ProductsToolbar({ page, pageSize, total, sort, onSortChange }: ProductsToolbarProps) {
  const { locale } = useLocale();
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(total, page * pageSize);
  const liveInventoryLabel = locale === 'hu' ? 'Élő készlet' : 'Live inventory';
  const supabaseLabel = locale === 'hu' ? 'Supabase szinkron' : 'Supabase synced';
  const sortLabel = locale === 'hu' ? 'Rendezés' : 'Sort';
  const placeholder = locale === 'hu' ? 'Rendezés kiválasztása' : 'Select sort';

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-border/70 bg-card/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-foreground">
          {locale === 'hu' ? 'Találatok ' : 'Showing '}
          {start}–{end} {locale === 'hu' ? ' / ' : ' of '}
          {total}{' '}
          {locale === 'hu'
            ? total === 1
              ? 'termék'
              : 'termék'
            : total === 1
              ? 'product'
              : 'products'}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline" className="rounded-full text-[11px] uppercase tracking-[0.3em]">
            {liveInventoryLabel}
          </Badge>
          <Badge variant="accent" className="rounded-full text-[11px]">
            {supabaseLabel}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center">
        <span className="text-muted-foreground">{sortLabel}</span>
        <Select value={sort} onValueChange={(value) => onSortChange(value as ProductSortOption)}>
          <SelectTrigger className="w-[200px] rounded-2xl border-border/70">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent side="bottom" className="rounded-2xl border-border/70">
            <SelectItem value="newest">{locale === 'hu' ? 'Legújabb' : 'Newest'}</SelectItem>
            <SelectItem value="popularity">{locale === 'hu' ? 'Népszerűség' : 'Popularity'}</SelectItem>
            <SelectItem value="price-asc">
              {locale === 'hu' ? 'Ár: növekvő' : 'Price: Low to High'}
            </SelectItem>
            <SelectItem value="price-desc">
              {locale === 'hu' ? 'Ár: csökkenő' : 'Price: High to Low'}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
