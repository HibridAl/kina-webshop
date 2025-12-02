import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getBrowserClient, getServerClient } from './supabase';
import {
  mockBrands,
  mockCategories,
  mockProducts,
  mockModels,
  mockVehicles,
  mockVehicleCompatibility,
} from './mock-data';
import { FALLBACK_SHIPPING_METHODS, type ShippingMethod } from './pricing';
import type {
  Brand,
  Model,
  Vehicle,
  Category,
  Product,
  Supplier,
  ProductSupplierMapping,
  VehicleProductCompatibility,
  Order,
  OrderItem,
  OrderPayment,
  CartItem,
  OrderLifecycleStatus,
  SavedVehicle,
  Address,
  Wishlist,
  WishlistItem,
} from './types';

export type ProductSortOption = 'popularity' | 'newest' | 'price-asc' | 'price-desc';

interface ProductQueryFilters {
  search?: string;
  category?: string;
  brand?: string;
  oem?: string;
  productIds?: string[];
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

interface PagedProductResult {
  items: Product[];
  total: number;
}

function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

let supabaseHealthy = true;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CheckoutLineItemInput = {
  productId: string;
  quantity: number;
  name?: string;
  price?: number;
};

type ResolvedCheckoutItem = {
  productId: string;
  quantity: number;
  name: string;
  price: number;
};

export type GuestOrderDetails = {
  email: string;
  name?: string | null;
  phone?: string | null;
};

const DEFAULT_CURRENCY = 'usd';

function looksLikeUuid(value?: string) {
  return !!value && UUID_REGEX.test(value);
}

function normalizeText(value?: string | null) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

type CanonicalOrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'cancelled' | 'refunded';

const ORDER_STATUS_ALIASES: Record<string, CanonicalOrderStatus> = {
  confirmed: 'paid',
  delivered: 'shipped',
};

const ORDER_STATUS_TRANSITIONS: Record<CanonicalOrderStatus, CanonicalOrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['processing', 'cancelled', 'refunded'],
  processing: ['shipped', 'cancelled', 'refunded'],
  shipped: ['cancelled', 'refunded'],
  cancelled: [],
  refunded: [],
};

function normalizeOrderStatus(status?: OrderLifecycleStatus | string | null): CanonicalOrderStatus | null {
  if (!status) return null;
  const lowered = status.toString().toLowerCase();
  if ((Object.keys(ORDER_STATUS_TRANSITIONS) as CanonicalOrderStatus[]).includes(lowered as CanonicalOrderStatus)) {
    return lowered as CanonicalOrderStatus;
  }
  const alias = ORDER_STATUS_ALIASES[lowered];
  return alias ?? null;
}

export function canTransitionOrderStatus(
  currentStatus: OrderLifecycleStatus | string | null | undefined,
  nextStatus: CanonicalOrderStatus
) {
  const normalizedCurrent = normalizeOrderStatus(currentStatus);
  if (!normalizedCurrent) {
    return nextStatus === 'pending';
  }
  if (normalizedCurrent === nextStatus) {
    return true;
  }
  return ORDER_STATUS_TRANSITIONS[normalizedCurrent]?.includes(nextStatus) ?? false;
}

export class OrderStatusTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderStatusTransitionError';
  }
}

let serviceClient: SupabaseClient | null = null;

function getServiceClient() {
  if (typeof window !== 'undefined') return null;
  if (serviceClient) return serviceClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn('[AutoHub] Missing Supabase URL or service key for server-side operations.');
    return null;
  }
  serviceClient = createClient(url, key, { auth: { persistSession: false } });
  return serviceClient;
}

function canUseSupabase(): boolean {
  if (typeof window === 'undefined') return false;
  return isSupabaseConfigured() && supabaseHealthy;
}

function fallbackProductsByIds(ids: string[]) {
  if (!ids?.length) return [] as Product[];
  return mockProducts.filter((p) => ids.includes(p.id));
}

function mapShippingMethodRow(record: Record<string, any>): ShippingMethod {
  const fallbackId = record?.code ? `shipping-${record.code}` : 'shipping-default';
  return {
    id: record?.id ?? record?.code ?? fallbackId,
    code: record?.code ?? null,
    name: record?.name ?? 'Shipping',
    description: record?.description ?? null,
    deliveryEstimate: record?.delivery_estimate ?? record?.duration ?? null,
    price: Number(record?.price ?? 0),
    currency: record?.currency ?? DEFAULT_CURRENCY,
    isExpress: Boolean(record?.is_express),
    isDefault: Boolean(record?.is_default),
    region: record?.region ?? null,
    active: record?.active ?? true,
  };
}

async function getAccessToken() {
  try {
    if (typeof window === 'undefined') return null;
    const client = getBrowserClient();
    const { data } = await client.auth.getSession();
    return data.session?.access_token ?? null;
  } catch (error) {
    console.error('Failed to obtain Supabase session token:', error);
    return null;
  }
}

async function cartApiRequest<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', body?: Record<string, any>) {
  if (typeof window === 'undefined') return null;
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated.');
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  let payload: BodyInit | undefined;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const response = await fetch('/api/cart', {
    method,
    headers,
    body: payload,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Cart API error');
  }

  if (response.status === 204) return null;
  return (await response.json()) as T;
}

function nowIso() {
  return new Date().toISOString();
}

export async function resolveCheckoutItems(items: CheckoutLineItemInput[]): Promise<ResolvedCheckoutItem[]> {
  if (!items?.length) return [];
  const sanitized = items
    .filter((item) => item.productId && item.quantity > 0)
    .map((item) => ({ ...item, quantity: Math.max(1, item.quantity) }));

  if (!sanitized.length) return [];
  const ids = sanitized.map((item) => item.productId);

  let products: Product[] = [];

  if (typeof window === 'undefined') {
    const client = getServiceClient();
    if (client) {
      try {
        const { data, error } = await client.from('products').select('id,name,price').in('id', ids);
        if (error) throw error;
        products = (data as Product[]) ?? [];
      } catch (error) {
        console.error('Error resolving checkout items via server client:', error);
        products = fallbackProductsByIds(ids);
      }
    } else {
      products = fallbackProductsByIds(ids);
    }
  } else {
    products = await getProductsByIds(ids);
  }

  return sanitized.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const rawPrice = product?.price ?? item.price ?? 0;
    return {
      productId: item.productId,
      quantity: item.quantity,
      name: product?.name ?? item.name ?? 'Item',
      price: typeof rawPrice === 'number' ? rawPrice : Number(rawPrice) || 0,
    } satisfies ResolvedCheckoutItem;
  });
}

// Product queries
export async function getProducts(limit = 50, offset = 0) {
  try {
    if (!canUseSupabase()) {
      console.log('[AutoHub] Using mock data (Supabase not configured)');
      return mockProducts.slice(offset, offset + limit);
    }

    const client = getBrowserClient();
    const start = Math.max(0, offset);
    const end = Math.max(start, start + limit - 1);

    const { data, error } = await client
      .from('products')
      .select('*')
      .range(start, end);

    if (error) throw error;
    return (data as Product[]) || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    supabaseHealthy = false;
    return mockProducts.slice(offset, offset + limit);
  }
}

export async function getProductById(id: string) {
  try {
    if (!canUseSupabase()) {
      return mockProducts.find((p) => p.id === id) || null;
    }

    const client = getBrowserClient();
    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return (data as Product) || null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return mockProducts.find((p) => p.id === id) || null;
  }
}

export async function searchProducts(query: string) {
  try {
    if (!canUseSupabase()) {
      return mockProducts.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase())
      );
    }

    const client = getBrowserClient();
    const { data, error } = await client
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,description.ilike.%${query}%`);

    if (error) throw error;
    return (data as Product[]) || [];
  } catch (error) {
    console.error('Error searching products:', error);
    supabaseHealthy = false;
    return mockProducts.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase())
    );
  }
}

export async function searchProductsByOem(oem: string) {
  const term = oem.trim();
  try {
    if (!canUseSupabase()) {
      return mockProducts.filter((p) => {
        const haystack = [
          p.sku?.toLowerCase() ?? '',
          ...(p.oem_numbers?.map((n) => n.toLowerCase()) ?? []),
        ];
        return haystack.some((val) => val.includes(term.toLowerCase()));
      });
    }

    const client = getBrowserClient();
    const { data, error } = await client
      .from('products')
      .select('*')
      .or(`oem_numbers.cs.{${term}},sku.ilike.%${term}%`);

    if (error) throw error;
    return (data as Product[]) || [];
  } catch (error) {
    console.error('Error searching products by OEM:', error);
    supabaseHealthy = false;
    return mockProducts.filter((p) => {
      const haystack = [
        p.sku?.toLowerCase() ?? '',
        ...(p.oem_numbers?.map((n) => n.toLowerCase()) ?? []),
      ];
      return haystack.some((val) => val.includes(term.toLowerCase()));
    });
  }
}

export async function getProductsPagedAndSorted({
  page = 1,
  limit = 12,
  sort = 'newest',
  filters = {},
}: {
  page?: number;
  limit?: number;
  sort?: ProductSortOption;
  filters?: ProductQueryFilters;
}): Promise<PagedProductResult> {
  try {
    const start = Math.max(0, (page - 1) * limit);
    const end = Math.max(start, start + limit - 1);

    if (!canUseSupabase()) {
      let results = [...mockProducts];

      if (filters.search) {
        const term = filters.search.toLowerCase();
        results = results.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.sku.toLowerCase().includes(term) ||
            (p.description ?? '').toLowerCase().includes(term)
        );
      }

      if (filters.minPrice !== undefined) {
        results = results.filter((p) => p.price >= (filters.minPrice as number));
      }

      if (filters.maxPrice !== undefined) {
        results = results.filter((p) => p.price <= (filters.maxPrice as number));
      }

      if (filters.oem) {
        const term = filters.oem.toLowerCase();
        results = results.filter((p) =>
          (p.oem_numbers ?? []).some((oem) => oem.toLowerCase().includes(term)) ||
          p.sku.toLowerCase().includes(term)
        );
      }

      if (filters.category) {
        results = results.filter((p) => p.category_id === filters.category);
      }

      if (filters.productIds && filters.productIds.length > 0) {
        results = results.filter((p) => filters.productIds?.includes(p.id));
      }

      if (filters.inStock) {
        results = results.filter((p) => p.stock_quantity > 0);
      }

      switch (sort) {
        case 'price-asc':
          results.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          results.sort((a, b) => b.price - a.price);
          break;
        case 'popularity':
          results.sort((a, b) => (b.stock_quantity ?? 0) - (a.stock_quantity ?? 0));
          break;
        case 'newest':
        default:
          results.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          break;
      }

      const total = results.length;
      const sliced = results.slice(start, end + 1);
      return { items: sliced, total };
    }

    const client = getBrowserClient();
    let query = client.from('products').select('*', { count: 'exact' });

    if (filters.category) {
      query = query.eq('category_id', filters.category);
    }
    // Brand filtering is not directly available on Product schema; handle client-side if needed.

    if (filters.productIds && filters.productIds.length > 0) {
      query = query.in('id', filters.productIds as string[]);
    }

    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice as number);
    }

    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice as number);
    }

    if (filters.oem) {
      query = query.or(`oem_numbers.cs.{${filters.oem}},sku.ilike.%${filters.oem}%`);
    }

    if (filters.inStock) {
      query = query.gt('stock_quantity', 0);
    }

    switch (sort) {
      case 'price-asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price-desc':
        query = query.order('price', { ascending: false });
        break;
      case 'popularity':
        query = query.order('stock_quantity', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data, error, count } = await query.range(start, end);
    if (error) throw error;

    const items = (data as Product[]) || [];
    const totalCount = count ?? items.length ?? 0;

    if (items.length === 0) {
      const fallback = mockProducts.slice(start, end + 1);
      return { items: fallback, total: mockProducts.length };
    }

    return {
      items,
      total: totalCount,
    };
  } catch (error) {
    console.error('Error fetching paged & sorted products:', error);
    supabaseHealthy = false;
    // Fallback to mock data if anything goes wrong
    const fallback = mockProducts.slice(0, limit);
    return { items: fallback, total: mockProducts.length };
  }
}

export async function getProductsByCategory(categoryId: string) {
  try {
    if (!canUseSupabase()) {
      return mockProducts.filter((p) => p.category_id === categoryId);
    }

    const client = getBrowserClient();
    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('category_id', categoryId);

    if (error) throw error;
    return (data as Product[]) || [];
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return mockProducts.filter((p) => p.category_id === categoryId);
  }
}

export async function getProductsByIds(ids: string[]) {
  if (!ids || ids.length === 0) return [];
  try {
    if (!canUseSupabase()) {
      return mockProducts.filter((p) => ids.includes(p.id));
    }
    const client = getBrowserClient();
    const { data, error } = await client.from('products').select('*').in('id', ids as string[]);
    if (error) throw error;
    return (data as Product[]) || [];
  } catch (error) {
    console.error('Error fetching products by ids:', error);
    return mockProducts.filter((p) => ids.includes(p.id));
  }
}

// Brand queries
export async function getBrands() {
  try {
    if (!canUseSupabase()) {
      return mockBrands;
    }

    const client = getBrowserClient();
    const { data, error } = await client.from('brands').select('*');

    if (error) throw error;
    return (data as Brand[]) || [];
  } catch (error) {
    console.error('Error fetching brands:', error);
    return mockBrands;
  }
}

export async function getBrandById(id: string) {
  try {
    if (!canUseSupabase() || !looksLikeUuid(id)) {
      return mockBrands.find((b) => b.id === id) || null;
    }

    const client = getBrowserClient();
    const { data, error } = await client
      .from('brands')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return (data as Brand) || null;
  } catch (error) {
    console.error('Error fetching brand:', error);
    return mockBrands.find((b) => b.id === id) || null;
  }
}

export async function getCategoryProductCount(categoryId: string) {
  try {
    if (!canUseSupabase()) {
      return mockProducts.filter((product) => product.category_id === categoryId).length;
    }
    if (!looksLikeUuid(categoryId)) {
      return 0;
    }

    const client = getBrowserClient();
    const { count, error } = await client
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);
    if (error) throw error;
    return count ?? 0;
  } catch (error) {
    console.error('Error counting products for category:', error);
    return 0;
  }
}

// Helper for vehicle selector: only Chinese EV-focused brands (MG, BYD, Omoda)
const CHINESE_BRAND_NAMES = ['MG', 'BYD', 'Omoda'] as const;

export async function getChineseBrands() {
  try {
    if (!canUseSupabase()) {
      return mockBrands.filter((brand) =>
        CHINESE_BRAND_NAMES.includes(brand.name as (typeof CHINESE_BRAND_NAMES)[number])
      );
    }

    const client = getBrowserClient();
    const { data, error } = await client
      .from('brands')
      .select('*')
      .in('name', CHINESE_BRAND_NAMES as unknown as string[]);

    if (error) throw error;
    return (data as Brand[]) || [];
  } catch (error) {
    console.error('Error fetching Chinese brands:', error);
    return mockBrands.filter((brand) =>
      CHINESE_BRAND_NAMES.includes(brand.name as (typeof CHINESE_BRAND_NAMES)[number])
    );
  }
}

// Model queries
export async function getModels(brandId?: string) {
  try {
    if (!canUseSupabase()) {
      if (!brandId) return mockModels;
      return mockModels.filter((model) => model.brand_id === brandId);
    }
    if (brandId && !looksLikeUuid(brandId)) return [];

    const client = getBrowserClient();
    let query = client.from('models').select('*');
    if (brandId) query = query.eq('brand_id', brandId);
    const { data, error } = await query;
    if (error) throw error;
    return (data as Model[]) || [];
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
}

export async function getModelById(id: string) {
  try {
    if (!canUseSupabase()) {
      return mockModels.find((model) => model.id === id) || null;
    }
    if (!looksLikeUuid(id)) {
      return mockModels.find((model) => model.id === id) || null;
    }

    const client = getBrowserClient();
    const { data, error } = await client
      .from('models')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return (data as Model) || null;
  } catch (error) {
    console.error('Error fetching model:', error);
    return null;
  }
}

// Helper for vehicle selector: models constrained by brand
export async function getModelsByBrand(brandId: string) {
  return getModels(brandId);
}

// Vehicle queries
export async function getVehicles(modelId?: string) {
  try {
    if (!canUseSupabase()) {
      if (!modelId) return mockVehicles;
      return mockVehicles.filter((vehicle) => vehicle.model_id === modelId);
    }
    if (modelId && !looksLikeUuid(modelId)) {
      return mockVehicles.filter((vehicle) => vehicle.model_id === modelId);
    }

    const client = getBrowserClient();
    let query = client.from('vehicles').select('*');
    if (modelId) query = query.eq('model_id', modelId);
    const { data, error } = await query;
    if (error) throw error;
    return (data as Vehicle[]) || [];
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return [];
  }
}

export async function getVehicleById(id: string) {
  try {
    if (!canUseSupabase()) {
      return mockVehicles.find((vehicle) => vehicle.id === id) || null;
    }
    if (!looksLikeUuid(id)) {
      return mockVehicles.find((vehicle) => vehicle.id === id) || null;
    }

    const client = getBrowserClient();
    const { data, error } = await client
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return (data as Vehicle) || null;
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return null;
  }
}

// Helper for vehicle selector: vehicles constrained by model
export async function getVehiclesByModel(modelId: string) {
  return getVehicles(modelId);
}

// Category queries
export async function getCategories() {
  try {
    if (!canUseSupabase()) {
      return mockCategories;
    }

    const client = getBrowserClient();
    const { data, error } = await client.from('categories').select('*');

    if (error) throw error;
    return (data as Category[]) || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return mockCategories;
  }
}

export async function getCategoryById(id: string) {
  try {
    if (!canUseSupabase()) {
      return mockCategories.find((c) => c.id === id) || null;
    }

    const client = getBrowserClient();
    const { data, error } = await client
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return (data as Category) || null;
  } catch (error) {
    console.error('Error fetching category:', error);
    return mockCategories.find((c) => c.id === id) || null;
  }
}

// Compatibility queries
export async function getCompatibleProducts(vehicleId: string) {
  try {
    if (!canUseSupabase()) {
      return mockVehicleCompatibility[vehicleId] ?? [];
    }
    if (!looksLikeUuid(vehicleId)) {
      return mockVehicleCompatibility[vehicleId] ?? [];
    }

    const client = getBrowserClient();
    const { data, error } = await client
      .from('vehicle_product_compatibility')
      .select('product_id')
      .eq('vehicle_id', vehicleId)
      .eq('compatible', true);
    if (error) throw error;
    return (
      data?.map((d: { product_id: string }) => d.product_id) as string[]
    ) || [];
  } catch (error) {
    console.error('Error fetching compatible products:', error);
    return [];
  }
}

// Supplier queries
export async function getSuppliers() {
  try {
    if (!canUseSupabase()) return [];

    const client = getBrowserClient();
    const { data, error } = await client.from('suppliers').select('*');
    if (error) throw error;
    return (data as Supplier[]) || [];
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return [];
  }
}

const SHIPPING_METHOD_COLUMNS =
  'id, code, name, description, price, currency, delivery_estimate, is_express, is_default, region, active';

async function fetchShippingMethods(client: SupabaseClient) {
  const { data, error } = await client
    .from('shipping_methods')
    .select(SHIPPING_METHOD_COLUMNS)
    .eq('active', true)
    .order('price', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapShippingMethodRow);
}

export async function getShippingMethods(): Promise<ShippingMethod[]> {
  try {
    if (!canUseSupabase()) return FALLBACK_SHIPPING_METHODS;
    const client = getBrowserClient();
    const methods = await fetchShippingMethods(client);
    return methods.length ? methods : FALLBACK_SHIPPING_METHODS;
  } catch (error) {
    console.error('Error fetching shipping methods:', error);
    return FALLBACK_SHIPPING_METHODS;
  }
}

export async function getServerShippingMethods(): Promise<ShippingMethod[]> {
  try {
    const client = getServiceClient();
    if (!client) return FALLBACK_SHIPPING_METHODS;
    const methods = await fetchShippingMethods(client);
    return methods.length ? methods : FALLBACK_SHIPPING_METHODS;
  } catch (error) {
    console.error('Error fetching shipping methods (server):', error);
    return FALLBACK_SHIPPING_METHODS;
  }
}

// Cart queries
export async function getCartItems(userId: string) {
  try {
    if (!canUseSupabase()) {
      return [];
    }

    const response = await cartApiRequest<{ items: CartItem[] }>('GET');
    return response?.items ?? [];
  } catch (error) {
    console.error('getCartItems: Error fetching cart items:', error);
    return [];
  }
}

export async function addToCart(
  userId: string,
  productId: string,
  quantity = 1,
  snapshot?: { price?: number; name?: string }
) {
  try {
    if (!canUseSupabase()) {
      return null;
    }

    await cartApiRequest('POST', {
      productId,
      quantity,
      snapshot,
    });
    return null;
  } catch (error) {
    console.error('addToCart: Error adding to cart:', error);
    return null;
  }
}

export async function updateCartItemQuantity(
  userId: string,
  productId: string,
  quantity: number
) {
  try {
    if (!canUseSupabase()) return;

    await cartApiRequest('PATCH', { productId, quantity });
  } catch (error) {
    console.error('Error updating cart item:', error);
  }
}

export async function removeFromCart(userId: string, productId: string) {
  try {
    if (!canUseSupabase()) return;

    await cartApiRequest('DELETE', { productId });
  } catch (error) {
    console.error('Error removing from cart:', error);
  }
}

export async function clearCartItems(userId: string) {
  try {
    if (!canUseSupabase()) return;

    await cartApiRequest('DELETE', { clearAll: true });
  } catch (error) {
    console.error('Error removing from cart:', error);
  }
}

// Order queries
async function orderHasPaymentWithStatus(client: SupabaseClient, orderId: string, status: OrderPayment['status']) {
  const { data, error } = await client
    .from('order_payments')
    .select('id')
    .eq('order_id', orderId)
    .eq('status', status)
    .limit(1);

  if (error) throw error;
  return Boolean(data && data.length);
}

export async function updateOrderStatus(
  orderId: string,
  nextStatusInput: OrderLifecycleStatus | string,
  options?: { skipPaymentCheck?: boolean }
) {
  const client = getServiceClient();
  if (!client) {
    throw new Error('[AutoHub] updateOrderStatus requires server-side Supabase credentials.');
  }

  const nextStatus = normalizeOrderStatus(nextStatusInput);
  if (!nextStatus) {
    throw new OrderStatusTransitionError(`Unknown order status: ${nextStatusInput}`);
  }

  const { data: existingOrder, error } = await client
    .from('orders')
    .select('id,status, user_id, total_amount, shipping_address, billing_address, created_at, updated_at')
    .eq('id', orderId)
    .single();

  if (error) throw error;

  const normalizedCurrent = normalizeOrderStatus(existingOrder.status);
  if (!canTransitionOrderStatus(normalizedCurrent, nextStatus)) {
    throw new OrderStatusTransitionError(
      `Invalid order status transition: ${normalizedCurrent ?? 'unknown'} → ${nextStatus}`
    );
  }

  if (normalizedCurrent === nextStatus) {
    return existingOrder as Order;
  }

  if (!options?.skipPaymentCheck) {
    if (nextStatus === 'paid') {
      const hasCompleted = await orderHasPaymentWithStatus(client, orderId, 'completed');
      if (!hasCompleted) {
        throw new OrderStatusTransitionError('Cannot mark order as paid without a completed payment record.');
      }
    }

    if (nextStatus === 'refunded') {
      const hasRefund = await orderHasPaymentWithStatus(client, orderId, 'refunded');
      if (!hasRefund) {
        throw new OrderStatusTransitionError('Cannot mark order as refunded without a recorded refund payment.');
      }
    }
  }

  const { data: updatedOrder, error: updateError } = await client
    .from('orders')
    .update({ status: nextStatus, updated_at: nowIso() })
    .eq('id', orderId)
    .select()
    .single();

  if (updateError) throw updateError;

  return updatedOrder as Order;
}

export async function createOrder(
  userId: string | null,
  totalAmount: number,
  items: Array<{ productId: string; quantity: number; price: number; name?: string }>,
  options?: {
    shipping?: Record<string, any>;
    billing?: Record<string, any>;
    guest?: GuestOrderDetails | null;
  }
) {
  try {
    if (!canUseSupabase()) return null;

    const guestDetails = options?.guest ?? null;
    const guestEmail = normalizeText(guestDetails?.email ?? null);
    const guestName = normalizeText(guestDetails?.name ?? null);
    const guestPhone = normalizeText(guestDetails?.phone ?? null);
    const isGuestOrder = !userId;

    if (isGuestOrder && !guestEmail) {
      throw new Error('Guest checkout requires a contact email.');
    }

    const serverClient = await getServerClient();
    const { data: order, error: orderError } = await serverClient
      .from('orders')
      .insert({
        user_id: userId ?? null,
        guest_email: isGuestOrder ? guestEmail : null,
        guest_name: isGuestOrder ? guestName : null,
        guest_phone: isGuestOrder ? guestPhone : null,
        total_amount: totalAmount,
        status: 'pending',
        shipping_address: options?.shipping ?? null,
        billing_address: options?.billing ?? null,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      price_at_purchase: item.price,
    }));

    const { error: itemsError } = await serverClient.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    return order as Order;
  } catch (error) {
    console.error('Error creating order:', error);
    return null;
  }
}

export async function getOrders(userId: string) {
  try {
    if (!canUseSupabase()) return [];

    const client = getBrowserClient();
    const { data, error } = await client
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as Order[]) || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

export async function getOrderById(id: string) {
  try {
    if (!canUseSupabase()) return null;

    const client = getBrowserClient();
    const { data, error } = await client.from('orders').select('*').eq('id', id).single();
    if (error) throw error;
    return (data as Order) || null;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

export async function getOrderItems(orderId: string) {
  try {
    if (!canUseSupabase()) return [];

    const client = getBrowserClient();
    const { data, error } = await client
      .from('order_items')
      .select('*, products(name, image_url, price, sku)')
      .eq('order_id', orderId);
    if (error) throw error;
    return (data as OrderItem[]) || [];
  } catch (error) {
    console.error('Error fetching order items:', error);
    return [];
  }
}

interface StripeOrderPayload {
  userId?: string | null;
  guest?: GuestOrderDetails | null;
  items: ResolvedCheckoutItem[];
  amountTotal: number;
  currency?: string;
  shipping?: Record<string, any> | null;
  billing?: Record<string, any> | null;
  paymentIntentId: string;
  sessionId: string;
  paymentStatus?: string;
  paymentMethod?: string | null;
  metadata?: Record<string, any> | null;
  receiptUrl?: string | null;
  customerEmail?: string | null;
  totals?: {
    subtotal: number;
    total: number;
    shipping: number;
    tax: number;
    taxLabel?: string;
    shippingMethodId?: string;
    shippingMethodCode?: string;
  };
}

export async function reorderPreviousOrder(userId: string, orderId: string) {
  try {
    if (!canUseSupabase()) return { success: false, missingProducts: [], added: 0 };

    const client = getBrowserClient();
    const { data: order, error: orderError } = await client.from('orders').select('id').eq('id', orderId).eq('user_id', userId).single();
    if (orderError || !order) {
      throw orderError ?? new Error('Order not found');
    }

    const { data: items, error: itemsError } = await client
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);
    if (itemsError) throw itemsError;

    let added = 0;
    const missingProducts: string[] = [];

    for (const item of items ?? []) {
      const productId = item.product_id;
      try {
        await addToCart(userId, productId, item.quantity);
        added += 1;
      } catch (error) {
        console.error('Reorder addToCart failed:', error);
        missingProducts.push(productId);
      }
    }

    return { success: true, missingProducts, added };
  } catch (error) {
    console.error('Error running reorder helper:', error);
    return { success: false, missingProducts: [], added: 0 };
  }
}

export async function getUserAddresses(userId: string) {
  try {
    if (!canUseSupabase()) return [];

    const client = getBrowserClient();
    const { data, error } = await client
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default_shipping', { ascending: false })
      .order('is_default_billing', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as Address[]) ?? [];
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return [];
  }
}

export async function createAddress(userId: string, payload: Partial<Address>) {
  try {
    if (!canUseSupabase()) return null;
    const client = getBrowserClient();
    const { data, error } = await client
      .from('addresses')
      .insert({ ...payload, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data as Address;
  } catch (error) {
    console.error('Error creating address:', error);
    return null;
  }
}

export async function updateAddress(addressId: string, userId: string, payload: Partial<Address>) {
  try {
    if (!canUseSupabase()) return null;
    const client = getBrowserClient();
    const { data, error } = await client
      .from('addresses')
      .update(payload)
      .eq('id', addressId)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data as Address;
  } catch (error) {
    console.error('Error updating address:', error);
    return null;
  }
}

export async function deleteAddress(addressId: string, userId: string) {
  try {
    if (!canUseSupabase()) return;
    const client = getBrowserClient();
    const { error } = await client
      .from('addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting address:', error);
  }
}

export async function setDefaultAddress(
  userId: string,
  addressId: string,
  options?: { type: 'shipping' | 'billing' | 'both' }
) {
  try {
    if (!canUseSupabase()) return null;
    const client = getBrowserClient();
    const target = options?.type ?? 'both';

    if (target === 'shipping' || target === 'both') {
      await client
        .from('addresses')
        .update({ is_default_shipping: false })
        .eq('user_id', userId)
        .eq('is_default_shipping', true);
    }
    if (target === 'billing' || target === 'both') {
      await client
        .from('addresses')
        .update({ is_default_billing: false })
        .eq('user_id', userId)
        .eq('is_default_billing', true);
    }

    const updates: Record<string, boolean> = {};
    if (target === 'shipping' || target === 'both') updates.is_default_shipping = true;
    if (target === 'billing' || target === 'both') updates.is_default_billing = true;

    const { data, error } = await client
      .from('addresses')
      .update(updates)
      .eq('id', addressId)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data as Address;
  } catch (error) {
    console.error('Error setting default address:', error);
    return null;
  }
}

async function ensureWishlist(userId: string) {
  const client = getBrowserClient();
  const { data, error } = await client
    .from('wishlists')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  if (data) return data as Wishlist;
  const { data: insert, error: insertError } = await client
    .from('wishlists')
    .insert({ user_id: userId })
    .select()
    .single();
  if (insertError) throw insertError;
  return insert as Wishlist;
}

export async function getWishlist(userId: string) {
  try {
    if (!canUseSupabase()) return null;
    const client = getBrowserClient();
    const wishlist = await ensureWishlist(userId);
    const { data: items, error } = await client
      .from('wishlist_items')
      .select('*, products(*)')
      .eq('wishlist_id', wishlist.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { ...wishlist, items: (items as WishlistItem[]) ?? [] } as Wishlist;
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return null;
  }
}

export async function addProductToWishlist(userId: string, productId: string) {
  try {
    if (!canUseSupabase()) return null;
    const client = getBrowserClient();
    const wishlist = await ensureWishlist(userId);
    const { data, error } = await client
      .from('wishlist_items')
      .upsert({ wishlist_id: wishlist.id, product_id: productId }, { onConflict: 'wishlist_id,product_id' })
      .select()
      .single();
    if (error) throw error;
    return data as WishlistItem;
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return null;
  }
}

export async function removeProductFromWishlist(userId: string, productId: string) {
  try {
    if (!canUseSupabase()) return;
    const client = getBrowserClient();
    const wishlist = await ensureWishlist(userId);
    const { error } = await client
      .from('wishlist_items')
      .delete()
      .eq('wishlist_id', wishlist.id)
      .eq('product_id', productId);
    if (error) throw error;
  } catch (error) {
    console.error('Error removing from wishlist:', error);
  }
}

export async function getMyVehicles(userId: string) {
  try {
    if (!canUseSupabase()) return [];
    const client = getBrowserClient();
    const { data, error } = await client
      .from('my_vehicles')
      .select('*, vehicles(*)')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as SavedVehicle[]) ?? [];
  } catch (error) {
    console.error('Error fetching saved vehicles:', error);
    return [];
  }
}

export async function addVehicleToGarage(
  userId: string,
  vehicleId: string,
  options?: { label?: string | null; makeDefault?: boolean }
) {
  try {
    if (!canUseSupabase()) return null;
    const client = getBrowserClient();
    const payload: Record<string, any> = {
      user_id: userId,
      vehicle_id: vehicleId,
      label: options?.label ?? null,
    };
    if (options?.makeDefault) {
      await client.from('my_vehicles').update({ is_default: false }).eq('user_id', userId).eq('is_default', true);
      payload.is_default = true;
    }
    const { data, error } = await client.from('my_vehicles').upsert(payload, { onConflict: 'user_id,vehicle_id' }).select().single();
    if (error) throw error;
    return data as SavedVehicle;
  } catch (error) {
    console.error('Error adding vehicle to garage:', error);
    return null;
  }
}

export async function removeVehicleFromGarage(userId: string, vehicleId: string) {
  try {
    if (!canUseSupabase()) return;
    const client = getBrowserClient();
    const { error } = await client
      .from('my_vehicles')
      .delete()
      .eq('user_id', userId)
      .eq('vehicle_id', vehicleId);
    if (error) throw error;
  } catch (error) {
    console.error('Error removing vehicle from garage:', error);
  }
}

export async function setDefaultVehicle(userId: string, vehicleId: string) {
  try {
    if (!canUseSupabase()) return null;
    const client = getBrowserClient();
    const { error: clearError } = await client
      .from('my_vehicles')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);
    if (clearError) throw clearError;
    const { data, error } = await client
      .from('my_vehicles')
      .upsert({ user_id: userId, vehicle_id: vehicleId, is_default: true }, { onConflict: 'user_id,vehicle_id' })
      .select()
      .single();
    if (error) throw error;
    return data as SavedVehicle;
  } catch (error) {
    console.error('Error setting default vehicle:', error);
    return null;
  }
}

export async function fulfillStripeOrder(payload: StripeOrderPayload) {
  const client = getServiceClient();
  if (!client) {
    console.warn('[AutoHub] Unable to fulfill Stripe order: Supabase service client unavailable.');
    return null;
  }

  const isGuestOrder = !payload.userId;
  const guestEmail = normalizeText(payload.guest?.email ?? payload.customerEmail ?? null);
  const guestName = normalizeText(payload.guest?.name ?? null);
  const guestPhone = normalizeText(payload.guest?.phone ?? null);

  if (isGuestOrder && !guestEmail) {
    console.warn('[AutoHub] Stripe order missing user or guest contact details.');
    return null;
  }

  const transactionId = payload.paymentIntentId || payload.sessionId;
  if (!transactionId) {
    console.warn('[AutoHub] Stripe order missing transaction identifier.');
    return null;
  }

  try {
    const { data: existingPayment } = await client
      .from('order_payments')
      .select('order_id')
      .eq('transaction_id', transactionId)
      .maybeSingle();

    if (existingPayment?.order_id) {
      return { orderId: existingPayment.order_id };
    }

    const orderItems = payload.items ?? [];
    if (!orderItems.length) {
      console.warn('[AutoHub] Stripe order has no resolved items.');
      return null;
    }

    const orderStatus = payload.paymentStatus === 'paid' ? 'paid' : 'pending';
    const paymentStatus = payload.paymentStatus === 'paid' ? 'completed' : payload.paymentStatus ?? 'pending';

    const { data: order, error: orderError } = await client
      .from('orders')
      .insert({
        user_id: payload.userId ?? null,
        guest_email: isGuestOrder ? guestEmail : null,
        guest_name: isGuestOrder ? guestName : null,
        guest_phone: isGuestOrder ? guestPhone : null,
        total_amount: payload.amountTotal,
        status: orderStatus,
        shipping_address: payload.shipping ?? null,
        billing_address: payload.billing ?? null,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const itemsPayload = orderItems.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      price_at_purchase: item.price,
    }));

    const { error: orderItemsError } = await client.from('order_items').insert(itemsPayload);
    if (orderItemsError) throw orderItemsError;

    const paymentMetadata = {
      ...(payload.metadata ?? {}),
      totals: payload.totals ?? null,
    };

    const { error: paymentError } = await client.from('order_payments').insert({
      order_id: order.id,
      amount: payload.amountTotal,
      currency: (payload.currency ?? DEFAULT_CURRENCY).toLowerCase(),
      status: paymentStatus,
      provider: 'stripe',
      transaction_id: transactionId,
      payment_method: payload.paymentMethod ?? 'card',
      checkout_session_id: payload.sessionId,
      receipt_url: payload.receiptUrl ?? null,
      metadata: paymentMetadata,
      customer_email: payload.customerEmail ?? null,
    });

    if (paymentError) throw paymentError;

    return { orderId: order.id };
  } catch (error) {
    console.error('Error fulfilling Stripe order:', error);
    return null;
  }
}
