'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Package, Folder, Car, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { LocalizedText } from '@/components/ui/localized-text';

// Matching API response types
interface SearchSuggestionItem {
  text: string;
  type: string;
  source?: string;
}

interface SearchCategorySuggestion {
  id: string;
  name: string;
}

interface SearchVehicleSuggestion {
  id: string;
  name: string;
  brand: string | null;
}

interface SearchProductSuggestion {
  id: string;
  name: string;
  sku: string | null;
  image_url: string | null;
  price: number | null;
}

interface SearchResponse {
  query: string;
  suggestions: SearchSuggestionItem[];
  categories: SearchCategorySuggestion[];
  vehicles: SearchVehicleSuggestion[];
  products: SearchProductSuggestion[];
}

interface SearchAutocompleteProps {
  placeholder?: string;
  onClose?: () => void;
  autoFocus?: boolean;
  className?: string;
}

export function SearchAutocomplete({
  placeholder,
  onClose,
  autoFocus,
  className,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchResponse | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Debounce logic
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        fetchSuggestions(query);
      } else {
        setResults(null);
        setIsOpen(false); // Close if query is too short
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const fetchSuggestions = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json() as SearchResponse;
      
      setResults(data);
      setIsOpen(true);
      setActiveIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results || !isOpen) return;

    const totalItems = 
      (results.suggestions.length) + 
      (results.categories.length) + 
      (results.vehicles.length) + 
      (results.products.length);

    if (totalItems === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % totalItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) {
        // Navigate to selected item
        const selected = getSelectedItem(activeIndex);
        if (selected) navigateToItem(selected);
      } else {
        // Submit form
        router.push(`/products?search=${encodeURIComponent(query)}`);
        onClose?.();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      onClose?.(); 
    }
  };

  const getSelectedItem = (index: number) => {
    if (!results) return null;
    let current = 0;
    
    // Suggestions
    if (index < current + results.suggestions.length) {
      return { type: 'suggestion', data: results.suggestions[index - current] };
    }
    current += results.suggestions.length;

    // Categories
    if (index < current + results.categories.length) {
      return { type: 'category', data: results.categories[index - current] };
    }
    current += results.categories.length;

    // Vehicles
    if (index < current + results.vehicles.length) {
      return { type: 'vehicle', data: results.vehicles[index - current] };
    }
    current += results.vehicles.length;

    // Products
    if (index < current + results.products.length) {
      return { type: 'product', data: results.products[index - current] };
    }
    
    return null;
  };

  const navigateToItem = (item: any) => {
    if (item.type === 'suggestion') {
      router.push(`/products?search=${encodeURIComponent(item.data.text)}`);
    } else if (item.type === 'category') {
      // Assuming slug logic, but API returns ID/Name. 
      // Ideally we'd have slug, but we can fallback to searching by category name if slug is missing
      // or update backend to return slug. For now, let's search by text if no slug.
      router.push(`/products?search=${encodeURIComponent(item.data.name)}`);
    } else if (item.type === 'vehicle') {
        // Navigate to vehicle specific page or search
        // Since we don't have a clear "vehicle detail" page in the mock, let's search by model name
        router.push(`/products?search=${encodeURIComponent(item.data.name)}`);
    } else if (item.type === 'product') {
      router.push(`/products/${item.data.id}`);
    }
    onClose?.();
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          className="flex h-10 w-full rounded-md border border-input bg-background px-9 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={placeholder || "Search..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
        ) : query.length > 0 ? (
          <button 
            onClick={() => { setQuery(''); setIsOpen(false); inputRef.current?.focus(); }}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {isOpen && results && (
        <div 
          ref={listRef}
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95"
        >
          <div className="max-h-[300px] overflow-y-auto p-1">
            {results.suggestions.length === 0 && 
             results.categories.length === 0 && 
             results.vehicles.length === 0 &&
             results.products.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                <LocalizedText hu="Nincs találat" en="No results found" />
              </div>
            )}

            {results.suggestions.length > 0 && (
              <div className="py-1">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  <LocalizedText hu="Keresési javaslatok" en="Suggestions" />
                </div>
                {results.suggestions.map((item, i) => {
                   const globalIndex = i;
                   return (
                    <div
                      key={i}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                        globalIndex === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                      )}
                      onClick={() => navigateToItem({ type: 'suggestion', data: item })}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      <span>{item.text}</span>
                    </div>
                   );
                })}
              </div>
            )}

            {results.categories.length > 0 && (
              <div className="py-1 border-t border-border/50">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  <LocalizedText hu="Kategóriák" en="Categories" />
                </div>
                {results.categories.map((item, i) => {
                   const globalIndex = results.suggestions.length + i;
                   return (
                    <div
                      key={item.id}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                        globalIndex === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                      )}
                      onClick={() => navigateToItem({ type: 'category', data: item })}
                    >
                      <Folder className="mr-2 h-4 w-4" />
                      <span>{item.name}</span>
                    </div>
                   );
                })}
              </div>
            )}

            {results.vehicles.length > 0 && (
              <div className="py-1 border-t border-border/50">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  <LocalizedText hu="Járművek" en="Vehicles" />
                </div>
                {results.vehicles.map((item, i) => {
                   const globalIndex = results.suggestions.length + results.categories.length + i;
                   return (
                    <div
                      key={item.id}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                        globalIndex === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                      )}
                      onClick={() => navigateToItem({ type: 'vehicle', data: item })}
                    >
                      <Car className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">{item.name}</span>
                        {item.brand && <span className="text-xs text-muted-foreground">{item.brand}</span>}
                      </div>
                    </div>
                   );
                })}
              </div>
            )}

            {results.products.length > 0 && (
              <div className="py-1 border-t border-border/50">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                   <LocalizedText hu="Termékek" en="Products" />
                </div>
                {results.products.map((item, i) => {
                   const globalIndex = results.suggestions.length + results.categories.length + results.vehicles.length + i;
                   return (
                    <div
                      key={item.id}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                        globalIndex === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                      )}
                      onClick={() => navigateToItem({ type: 'product', data: item })}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      <div className="flex flex-col flex-1">
                        <span className="font-medium">{item.name}</span>
                        {item.sku && <span className="text-xs text-muted-foreground">SKU: {item.sku}</span>}
                      </div>
                      {item.price !== null && <span className="font-bold text-xs">${item.price}</span>}
                    </div>
                   );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
