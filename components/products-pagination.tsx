'use client';

import { useLocale } from '@/hooks/use-locale';

interface ProductsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function ProductsPagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}: ProductsPaginationProps) {
  const { locale } = useLocale();
  const prevLabel = locale === 'hu' ? 'Előző' : 'Previous';
  const nextLabel = locale === 'hu' ? 'Következő' : 'Next';
  const pages = buildPages(currentPage, totalPages);

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Product pagination">
      <button
        type="button"
        className="rounded-full border border-border/70 px-3 py-1 text-sm text-muted-foreground transition hover:text-foreground disabled:opacity-50"
        disabled={currentPage <= 1 || isLoading}
        onClick={() => onPageChange(currentPage - 1)}
      >
        {prevLabel}
      </button>
      {pages.map((page, idx) =>
        page === 'ellipsis' ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            className={`min-w-[2.5rem] rounded-full px-3 py-1 text-sm font-medium transition ${
              page === currentPage
                ? 'bg-primary text-primary-foreground shadow'
                : 'border border-border/70 bg-background text-foreground hover:border-primary'
            }`}
            disabled={isLoading}
            onClick={() => onPageChange(page as number)}
          >
            {page}
          </button>
        )
      )}
      <button
        type="button"
        className="rounded-full border border-border/70 px-3 py-1 text-sm text-muted-foreground transition hover:text-foreground disabled:opacity-50"
        disabled={currentPage >= totalPages || isLoading}
        onClick={() => onPageChange(currentPage + 1)}
      >
        {nextLabel}
      </button>
    </nav>
  );
}

function buildPages(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: Array<number | 'ellipsis'> = [1];

  if (current > 4) pages.push('ellipsis');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  if (current < total - 3) pages.push('ellipsis');

  pages.push(total);

  return pages;
}
