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

// --- Order Actions ---

export interface AdminOrder extends Order {
  users: { email: string | null; company_name: string | null } | null;
  payment_status?: string; // Computed from order_payments
}

export interface AdminOrderDetails extends AdminOrder {
  order_items: (OrderItem & { products: { name: string; sku: string; image_url: string | null } | null })[];
  order_payments: OrderPayment[];
}

export async function getAdminOrdersAction({
  page = 1,
  limit = 20,
  status,
  search,
  date,
}: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  date?: string;
}): Promise<{ orders: AdminOrder[]; total: number }> {
  const supabase = getServiceSupabase();
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  let query = supabase
    .from('orders')
    .select('*, users(email, company_name), order_payments(status)', { count: 'exact' });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (date) {
    // Filter by specific date (YYYY-MM-DD)
    // We assume date is in 'YYYY-MM-DD' format
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;
    query = query.gte('created_at', startOfDay).lte('created_at', endOfDay);
  }

  if (search) {
    // Searching by ID or user email is tricky with single query.
    // For now, let's support searching by Order ID directly if it looks like UUID,
    // or filter by status if not.
    // Supabase doesn't easily support "or" across joined tables in one go without complex syntax.
    // Let's try basic ID search.
    if (search.match(/^[0-9a-f]{8}-/i)) {
        query = query.eq('id', search);
    }
  }

  query = query.order('created_at', { ascending: false }).range(start, end);

  const { data, error, count } = await query;

  if (error) {
    console.error('[admin] getAdminOrdersAction error', error);
    return { orders: [], total: 0 };
  }

  const orders = (data as any[]).map((order) => {
    // Derive a simple payment status
    const payments = order.order_payments as { status: string }[] | null;
    const paymentStatus = payments && payments.length > 0 ? payments[0].status : 'pending';
    return {
        ...order,
        payment_status: paymentStatus,
    } as AdminOrder;
  });

  return { orders, total: count ?? 0 };
}

export async function getAdminOrderDetailsAction(orderId: string): Promise<AdminOrderDetails | null> {
    const supabase = getServiceSupabase();
    
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            users(email, company_name),
            order_items(*, products(name, sku, image_url)),
            order_payments(*)
        `)
        .eq('id', orderId)
        .single();

    if (error) {
        console.error('[admin] getAdminOrderDetailsAction error', error);
        return null;
    }

    return data as AdminOrderDetails;
}

export async function updateOrderStatusAction(orderId: string, status: string): Promise<ActionResult> {
    const supabase = getServiceSupabase();
    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

    if (error) {
        return { success: false, error: error.message };
    }
    revalidatePath('/admin/orders');
    return { success: true };
}

export async function updatePaymentStatusAction(paymentId: string, status: string): Promise<ActionResult> {
    const supabase = getServiceSupabase();
    const { error } = await supabase
        .from('order_payments')
        .update({ status })
        .eq('id', paymentId);

    if (error) {
        return { success: false, error: error.message };
    }
    revalidatePath('/admin/orders');
    return { success: true };
}
