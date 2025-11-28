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

const DEFAULT_CURRENCY = 'usd';

function looksLikeUuid(value?: string) {
  return !!value && UUID_REGEX.test(value);
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
export async function createOrder(
  userId: string,
  totalAmount: number,
  items: Array<{ productId: string; quantity: number; price: number; name?: string }>,
  options?: { shipping?: Record<string, any>; billing?: Record<string, any> }
) {
  try {
    if (!canUseSupabase()) return null;

    const serverClient = await getServerClient();
    const { data: order, error: orderError } = await serverClient
      .from('orders')
      .insert({
        user_id: userId,
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
  userId: string;
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

export async function fulfillStripeOrder(payload: StripeOrderPayload) {
  const client = getServiceClient();
  if (!client) {
    console.warn('[AutoHub] Unable to fulfill Stripe order: Supabase service client unavailable.');
    return null;
  }

  if (!payload.userId) {
    console.warn('[AutoHub] Stripe order missing user context.');
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
        user_id: payload.userId,
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
