import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getServiceSupabase } from '@/lib/supabase-server';

const payloadSchema = z.object({
  supplierId: z.string().uuid(),
  importType: z.string().min(2),
  data: z.array(
    z.object({
      sku: z.string().min(1),
      name: z.string().min(1),
      price: z.number().nonnegative(),
      stock: z.number().nonnegative(),
      category: z.string().optional(),
      oem_numbers: z.string().optional(),
      description: z.string().optional(),
    })
  ),
});

interface ProductUpsertResult {
  id: string;
  created: boolean;
}

const HISTORY_TABLE = 'supplier_import_runs';

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = payloadSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { supplierId, importType, data } = parsed.data;
    if (data.length === 0) {
      return NextResponse.json(
        { error: 'No products provided for import.' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { data: supplier, error: supplierErr } = await supabase
      .from('suppliers')
      .select('id')
      .eq('id', supplierId)
      .maybeSingle();

    if (supplierErr || !supplier) {
      return NextResponse.json(
        { error: 'Supplier not found.' },
        { status: 404 }
      );
    }

    const categoryCache = new Map<string, string>();
    const processed = await processImportBatch(supabase, supplierId, data, categoryCache);

    await supabase
      .from('suppliers')
      .update({ last_synced: new Date().toISOString() })
      .eq('id', supplierId);

    let historyId: string | null = null;
    try {
      const { data: history } = await supabase
        .from(HISTORY_TABLE)
        .insert({
          supplier_id: supplierId,
          import_type: importType,
          imported: processed.imported,
          failed: processed.errors.length,
          errors: processed.errors.slice(0, 10),
        })
        .select('id')
        .single();
      historyId = history?.id ?? null;
    } catch (historyError) {
      console.warn('Unable to record import history:', historyError);
    }

    return NextResponse.json({
      success: true,
      supplierId,
      importType,
      imported: processed.imported,
      failed: processed.errors.length,
      errors: processed.errors,
      timestamp: new Date().toISOString(),
      historyId,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Import failed', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supplierId = request.nextUrl.searchParams.get('supplierId');
  if (!supplierId) {
    return NextResponse.json({ error: 'Missing supplierId' }, { status: 400 });
  }

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from(HISTORY_TABLE)
      .select('id, imported, failed, errors, import_type, created_at')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      const errorCode = (error as any)?.code;
      if (errorCode === '42P01' || errorCode === 'PGRST205') {
        return NextResponse.json({ success: true, supplierId, history: [] });
      }
      console.error('History lookup failed:', error);
      return NextResponse.json({ error: 'History unavailable.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      supplierId,
      history: data ?? [],
    });
  } catch (error) {
    console.error('History error:', error);
    return NextResponse.json(
      { error: 'Unable to load history', details: String(error) },
      { status: 500 }
    );
  }
}

async function processImportBatch(
  client: SupabaseClient,
  supplierId: string,
  items: z.infer<typeof payloadSchema>['data'],
  categoryCache: Map<string, string>
) {
  let imported = 0;
  const errors: string[] = [];

  for (const item of items) {
    try {
      const categoryId = await resolveCategoryId(client, item.category, categoryCache);
      const product = await upsertProductRecord(client, item, categoryId);
      await client
        .from('product_supplier_mapping')
        .upsert(
          {
            product_id: product.id,
            supplier_id: supplierId,
            supplier_sku: item.sku,
            supplier_price: item.price,
            supplier_stock: item.stock,
          },
          { onConflict: 'product_id,supplier_id' }
        );
      imported += 1;
    } catch (error: any) {
      const message = error?.message || 'Unexpected error';
      errors.push(`SKU ${item.sku}: ${message}`);
    }
  }

  return { imported, errors };
}

async function resolveCategoryId(
  client: SupabaseClient,
  categoryName?: string,
  cache?: Map<string, string>
): Promise<string> {
  const normalized = categoryName?.trim();
  const key = normalized?.toLowerCase() || '__default';
  if (cache?.has(key)) {
    return cache.get(key)!;
  }

  if (normalized) {
    const { data: existing } = await client
      .from('categories')
      .select('id')
      .ilike('name', normalized)
      .maybeSingle();
    if (existing?.id) {
      cache?.set(key, existing.id);
      return existing.id;
    }
    const { data: inserted, error } = await client
      .from('categories')
      .insert({ name: normalized })
      .select('id')
      .single();
    if (error || !inserted?.id) {
      throw new Error('Failed to create category');
    }
    cache?.set(key, inserted.id);
    return inserted.id;
  }

  const { data: fallback, error } = await client.from('categories').select('id').limit(1).maybeSingle();
  if (error || !fallback?.id) {
    throw new Error('No categories available. Please create one first.');
  }
  cache?.set(key, fallback.id);
  return fallback.id;
}

async function upsertProductRecord(
  client: SupabaseClient,
  item: z.infer<typeof payloadSchema>['data'][number],
  categoryId: string
): Promise<ProductUpsertResult> {
  const basePayload = {
    name: item.name,
    category_id: categoryId,
    description: item.description ?? null,
    price: item.price,
    stock_quantity: item.stock,
    oem_numbers: normalizeOemList(item.oem_numbers),
  };

  const { data: existing } = await client
    .from('products')
    .select('id')
    .eq('sku', item.sku)
    .maybeSingle();

  if (existing?.id) {
    const { error: updateError } = await client
      .from('products')
      .update(basePayload)
      .eq('id', existing.id);
    if (updateError) {
      throw new Error(updateError.message);
    }
    return { id: existing.id, created: false };
  }

  const { data: inserted, error: insertError } = await client
    .from('products')
    .insert({ sku: item.sku, image_url: '/placeholder.svg?height=300&width=300', ...basePayload })
    .select('id')
    .single();
  if (insertError || !inserted?.id) {
    throw new Error(insertError?.message || 'Unable to create product');
  }
  return { id: inserted.id, created: true };
}

function normalizeOemList(oemValue?: string) {
  if (!oemValue) return [];
  return oemValue
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
}
