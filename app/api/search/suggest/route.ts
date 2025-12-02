import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  type SearchSuggestionsResponse,
  type SearchSuggestionItem,
  type SearchCategorySuggestion,
  type SearchVehicleSuggestion,
  type SearchProductSuggestion,
} from '@/lib/types';
import { mockProducts, mockCategories, mockModels, mockBrands } from '@/lib/mock-data';
import { getServiceSupabase, getReadonlySupabase } from '@/lib/supabase-server';

const MIN_QUERY_LENGTH = 2;
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;
const POPULAR_SEARCHES = [
  'brake pads',
  'oil filter',
  'spark plugs',
  'battery',
  'led headlights',
];

type SuggestionGroups = Pick<SearchSuggestionsResponse, 'suggestions' | 'categories' | 'vehicles' | 'products'>;

function clampLimit(value?: number | null) {
  if (!value || Number.isNaN(value)) return DEFAULT_LIMIT;
  return Math.min(Math.max(value, 1), MAX_LIMIT);
}

function baseResponse(query: string): SearchSuggestionsResponse {
  return {
    query,
    suggestions: [],
    categories: [],
    vehicles: [],
    products: [],
  };
}

function buildPopularResponse(query: string, limit: number) {
  const response = baseResponse(query);
  response.suggestions = POPULAR_SEARCHES.slice(0, limit).map((text) => ({
    text,
    type: 'popular',
    source: 'popular',
  } satisfies SearchSuggestionItem));
  return response;
}

function normalizeText(value?: string | null) {
  return value?.trim() ?? '';
}

function dedupeSuggestions(items: SearchSuggestionItem[], limit: number) {
  const seen = new Set<string>();
  const result: SearchSuggestionItem[] = [];
  for (const item of items) {
    const key = item.text.toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
    if (result.length >= limit) break;
  }
  return result;
}

function getServerSupabase(): SupabaseClient | null {
  try {
    return getServiceSupabase();
  } catch (error) {
    try {
      return getReadonlySupabase();
    } catch (_) {
      return null;
    }
  }
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim().length) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

async function fetchSupabaseSuggestions(client: SupabaseClient, query: string, limit: number): Promise<SuggestionGroups | null> {
  const ilikePattern = `%${query}%`;
  try {
    const [productsRes, categoriesRes, modelsRes] = await Promise.all([
      client
        .from('products')
        .select('id,name,price,image_url,sku')
        .ilike('name', ilikePattern)
        .limit(limit),
      client
        .from('categories')
        .select('id,name')
        .ilike('name', ilikePattern)
        .limit(limit),
      client
        .from('models')
        .select('id,name, brand:brands(name)')
        .ilike('name', ilikePattern)
        .limit(limit),
    ]);

    if (productsRes.error) throw productsRes.error;
    if (categoriesRes.error) throw categoriesRes.error;
    if (modelsRes.error) throw modelsRes.error;

    const products: SearchProductSuggestion[] = (productsRes.data ?? []).map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku ?? null,
      price: toNumberOrNull(product.price),
      image_url: product.image_url ?? null,
    }));

    const categories: SearchCategorySuggestion[] = (categoriesRes.data ?? []).map((category) => ({
      id: category.id,
      name: category.name,
    }));

    const vehicles: SearchVehicleSuggestion[] = (modelsRes.data ?? []).map((model) => ({
      id: model.id,
      name: model.name,
      brand: model.brand?.name ?? null,
    }));

    const combinedSuggestionCandidates: SearchSuggestionItem[] = [
      ...products.map((product) => ({ text: product.name, type: 'term', source: 'product' as const })),
      ...categories.map((category) => ({ text: category.name, type: 'term', source: 'category' as const })),
    ];

    const suggestions = dedupeSuggestions(combinedSuggestionCandidates, limit);

    return {
      suggestions,
      categories,
      vehicles,
      products,
    };
  } catch (error) {
    console.error('[search/suggest] Supabase query failed:', error);
    return null;
  }
}

function fetchMockSuggestions(query: string, limit: number): SuggestionGroups {
  const normalized = query.toLowerCase();

  const products = mockProducts
    .filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(normalized);
      const skuMatch = product.sku?.toLowerCase().includes(normalized);
      const oemMatch = (product.oem_numbers ?? []).some((oem) => oem.toLowerCase().includes(normalized));
      return nameMatch || skuMatch || oemMatch;
    })
    .slice(0, limit)
    .map<SearchProductSuggestion>((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: toNumberOrNull(product.price),
      image_url: product.image_url ?? null,
    }));

  const categories = mockCategories
    .filter((category) => category.name.toLowerCase().includes(normalized))
    .slice(0, limit)
    .map<SearchCategorySuggestion>((category) => ({
      id: category.id,
      name: category.name,
    }));

  const vehicles = mockModels
    .filter((model) => model.name.toLowerCase().includes(normalized))
    .slice(0, limit)
    .map<SearchVehicleSuggestion>((model) => {
      const brandName = mockBrands.find((brand) => brand.id === model.brand_id)?.name ?? null;
      return {
        id: model.id,
        name: model.name,
        brand: brandName,
      };
    });

  const suggestions = dedupeSuggestions(
    [
      ...products.map((product) => ({ text: product.name, type: 'term', source: 'product' as const })),
      ...categories.map((category) => ({ text: category.name, type: 'term', source: 'category' as const })),
    ],
    limit
  );

  return {
    suggestions,
    categories,
    vehicles,
    products,
  };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const rawQuery = url.searchParams.get('q') ?? '';
    const limit = clampLimit(Number(url.searchParams.get('limit')));
    const query = rawQuery.trim();

    if (!query) {
      return NextResponse.json(buildPopularResponse('', limit));
    }

    if (query.length < MIN_QUERY_LENGTH) {
      return NextResponse.json(buildPopularResponse(query, limit));
    }

    const client = getServerSupabase();
    if (client) {
      const supabaseData = await fetchSupabaseSuggestions(client, query, limit);
      if (supabaseData) {
        return NextResponse.json({
          query,
          ...supabaseData,
        } satisfies SearchSuggestionsResponse);
      }
    }

    const fallback = fetchMockSuggestions(query, limit);
    return NextResponse.json({
      query,
      ...fallback,
    } satisfies SearchSuggestionsResponse);
  } catch (error) {
    console.error('[search/suggest] Unexpected error:', error);
    return NextResponse.json({ error: 'Unable to fetch suggestions.' }, { status: 500 });
  }
}
