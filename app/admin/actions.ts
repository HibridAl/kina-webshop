'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServiceSupabase } from '@/lib/supabase-server';

type ActionResult = { success: boolean; error?: string };

const trimToNull = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const productSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().min(2).max(100),
  name: z.string().min(2).max(255),
  category_id: z.string().uuid({ message: 'Category is required' }),
  description: z.string().max(1000).optional().nullable(),
  price: z.number().nonnegative(),
  stock_quantity: z.number().int().nonnegative(),
  image_url: z.string().url().optional().or(z.literal('')),
  oem_numbers: z.array(z.string().min(1)).optional(),
});

type ProductInput = z.input<typeof productSchema>;

export async function saveProductAction(payload: ProductInput): Promise<ActionResult> {
  const parsed = productSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid product data' };
  }

  const { id, ...data } = parsed.data;
  const supabase = getServiceSupabase();

  const normalized = {
    ...data,
    description: trimToNull(data.description),
    image_url: trimToNull(data.image_url ?? null),
    oem_numbers: data.oem_numbers ?? [],
  };

  const query = supabase.from('products');
  const { error } = id
    ? await query.update(normalized).eq('id', id)
    : await query.insert(normalized);

  if (error) {
    console.error('[admin] saveProductAction error', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/products');
  revalidatePath('/products');
  return { success: true };
}

export async function deleteProductAction(productId: string): Promise<ActionResult> {
  if (!productId) return { success: false, error: 'Missing product id' };
  const supabase = getServiceSupabase();
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) {
    console.error('[admin] deleteProductAction error', error);
    return { success: false, error: error.message };
  }
  revalidatePath('/admin/products');
  return { success: true };
}

const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(255),
  description: z.string().max(1000).optional().nullable(),
});

type CategoryInput = z.input<typeof categorySchema>;

export async function saveCategoryAction(payload: CategoryInput): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid category data' };
  }

  const { id, ...data } = parsed.data;
  const supabase = getServiceSupabase();
  const normalized = {
    ...data,
    description: trimToNull(data.description),
  };

  const query = supabase.from('categories');
  const { error } = id
    ? await query.update(normalized).eq('id', id)
    : await query.insert(normalized);

  if (error) {
    console.error('[admin] saveCategoryAction error', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/categories');
  return { success: true };
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionResult> {
  if (!categoryId) return { success: false, error: 'Missing category id' };
  const supabase = getServiceSupabase();
  const { error } = await supabase.from('categories').delete().eq('id', categoryId);
  if (error) {
    console.error('[admin] deleteCategoryAction error', error);
    return { success: false, error: error.message };
  }
  revalidatePath('/admin/categories');
  return { success: true };
}

const supplierSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(255),
  api_endpoint: z.string().url().optional().or(z.literal('')),
  import_type: z.string().max(50).optional().nullable(),
  api_identifier: z.string().max(100).optional().or(z.literal('')),
  contact_name: z.string().max(255).optional().or(z.literal('')),
  contact_email: z.string().email().optional().or(z.literal('')),
});

type SupplierInput = z.input<typeof supplierSchema>;

export async function saveSupplierAction(payload: SupplierInput): Promise<ActionResult> {
  const parsed = supplierSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid supplier data' };
  }

  const { id, ...data } = parsed.data;
  const supabase = getServiceSupabase();
  const normalized = {
    ...data,
    api_endpoint: trimToNull(data.api_endpoint),
    import_type: trimToNull(data.import_type),
    api_identifier: trimToNull(data.api_identifier),
    contact_name: trimToNull(data.contact_name),
    contact_email: trimToNull(data.contact_email),
  };

  const query = supabase.from('suppliers');
  const { error } = id
    ? await query.update(normalized).eq('id', id)
    : await query.insert(normalized);

  if (error) {
    console.error('[admin] saveSupplierAction error', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/suppliers');
  return { success: true };
}

export async function deleteSupplierAction(supplierId: string): Promise<ActionResult> {
  if (!supplierId) return { success: false, error: 'Missing supplier id' };
  const supabase = getServiceSupabase();
  const { error } = await supabase.from('suppliers').delete().eq('id', supplierId);
  if (error) {
    console.error('[admin] deleteSupplierAction error', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/suppliers');
  return { success: true };
}
