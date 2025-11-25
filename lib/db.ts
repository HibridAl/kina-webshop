import { getBrowserClient, getServerClient } from './supabase';
import {
  mockBrands,
  mockCategories,
  mockProducts,
  mockModels,
  mockVehicles,
  mockVehicleCompatibility,
} from './mock-data';
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

function looksLikeUuid(value?: string) {
  return !!value && UUID_REGEX.test(value);
}

function canUseSupabase(): boolean {
  if (typeof window === 'undefined') return false;
  return isSupabaseConfigured() && supabaseHealthy;
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

// Cart queries
export async function getCartItems(userId: string) {
  try {
    if (!canUseSupabase()) return [];

    const client = getBrowserClient();
    const { data, error } = await client
      .from('cart_items')
      .select('id, product_id, quantity, price_at_add, name_snapshot, products(name, price, image_url)')
      .eq('user_id', userId);
    if (error) throw error;
    return (data as CartItem[]) || [];
  } catch (error) {
    console.error('Error fetching cart items:', error);
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
    if (!canUseSupabase()) return null;

    const client = getBrowserClient();
    const { data: existing } = await client
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .maybeSingle();

    if (existing) {
      const newQuantity = (existing.quantity ?? 0) + quantity;
      await client
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existing.id);
      return existing;
    }

    const { data, error } = await client.from('cart_items').insert({
      user_id: userId,
      product_id: productId,
      quantity,
      price_at_add: snapshot?.price ?? null,
      name_snapshot: snapshot?.name ?? null,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding to cart:', error);
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

    const client = getBrowserClient();
    await client
      .from('cart_items')
      .update({ quantity })
      .eq('user_id', userId)
      .eq('product_id', productId);
  } catch (error) {
    console.error('Error updating cart item:', error);
  }
}

export async function removeFromCart(userId: string, productId: string) {
  try {
    if (!canUseSupabase()) return;

    const client = getBrowserClient();
    await client
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
  } catch (error) {
    console.error('Error removing from cart:', error);
  }
}

export async function clearCartItems(userId: string) {
  try {
    if (!canUseSupabase()) return;

    const client = getBrowserClient();
    await client.from('cart_items').delete().eq('user_id', userId);
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
