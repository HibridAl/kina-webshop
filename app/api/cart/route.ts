import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn('[Cart API] Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

const adminClient = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  : null;

type CartPayload = {
  productId?: string;
  quantity?: number;
  snapshot?: { price?: number | null; name?: string | null };
  clearAll?: boolean;
};

async function ensureProfileRow(user: SupabaseUser) {
  if (!adminClient) return;
  try {
    const { data, error } = await adminClient
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[Cart API] Error checking profile row:', error);
      return;
    }

    if (!data) {
      const { error: insertError } = await adminClient
        .from('users')
        .insert({
          id: user.id,
          email: user.email ?? null,
          role: 'customer',
          company_name: null,
          is_b2b: false,
        });

      if (insertError) {
        console.error('[Cart API] Error creating profile row:', insertError);
      }
    }
  } catch (error) {
    console.error('[Cart API] Unexpected error ensuring profile row:', error);
  }
}

async function requireUser(request: NextRequest) {
  if (!adminClient) {
    return { errorResponse: NextResponse.json({ error: 'Server not configured.' }, { status: 500 }) };
  }
  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return { errorResponse: NextResponse.json({ error: 'Missing authorization header.' }, { status: 401 }) };
  }
  const token = header.slice(7);
  const { data, error } = await adminClient.auth.getUser(token);
  if (error || !data.user) {
    return { errorResponse: NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401 }) };
  }
  await ensureProfileRow(data.user);
  return { user: data.user };
}

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if ('errorResponse' in auth) return auth.errorResponse;

  const { data, error } = await adminClient!
    .from('cart_items')
    .select('id, product_id, quantity, products(name, image_url, price)')
    .eq('user_id', auth.user.id);

  if (error) {
    console.error('[Cart API] Error fetching cart items:', error);
    return NextResponse.json({ error: 'Failed to load cart.' }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ('errorResponse' in auth) return auth.errorResponse;

  const payload = (await request.json().catch(() => ({}))) as CartPayload;
  const productId = payload.productId;
  const quantity = Math.max(1, Number(payload.quantity) || 1);

  if (!productId) {
    return NextResponse.json({ error: 'productId is required.' }, { status: 400 });
  }

  const { data: existing, error: existingError } = await adminClient!
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', auth.user.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (existingError) {
    console.error('[Cart API] Error checking existing cart item:', existingError);
    return NextResponse.json({ error: 'Unable to add item.' }, { status: 500 });
  }

  if (existing) {
    const newQuantity = (existing.quantity ?? 0) + quantity;
    const { error } = await adminClient!
      .from('cart_items')
      .update({ quantity: newQuantity })
      .eq('id', existing.id);
    if (error) {
      console.error('[Cart API] Error updating cart item:', error);
      return NextResponse.json({ error: 'Unable to update item.' }, { status: 500 });
    }
    return NextResponse.json({ success: true, quantity: newQuantity });
  }

  const { error: insertError } = await adminClient!
    .from('cart_items')
    .insert({
      user_id: auth.user.id,
      product_id: productId,
      quantity,
    });

  if (insertError) {
    console.error('[Cart API] Error inserting cart item:', insertError);
    return NextResponse.json({ error: 'Unable to add item.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireUser(request);
  if ('errorResponse' in auth) return auth.errorResponse;

  const payload = (await request.json().catch(() => ({}))) as CartPayload;
  const productId = payload.productId;
  const quantity = Number(payload.quantity);

  if (!productId || Number.isNaN(quantity)) {
    return NextResponse.json({ error: 'productId and quantity are required.' }, { status: 400 });
  }

  if (quantity <= 0) {
    await adminClient!.from('cart_items').delete().eq('user_id', auth.user.id).eq('product_id', productId);
    return NextResponse.json({ success: true });
  }

  const { error } = await adminClient!
    .from('cart_items')
    .update({ quantity })
    .eq('user_id', auth.user.id)
    .eq('product_id', productId);

  if (error) {
    console.error('[Cart API] Error updating quantity:', error);
    return NextResponse.json({ error: 'Unable to update quantity.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireUser(request);
  if ('errorResponse' in auth) return auth.errorResponse;

  const payload = (await request.json().catch(() => ({}))) as CartPayload;

  if (payload.clearAll) {
    const { error } = await adminClient!.from('cart_items').delete().eq('user_id', auth.user.id);
    if (error) {
      console.error('[Cart API] Error clearing cart:', error);
      return NextResponse.json({ error: 'Unable to clear cart.' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (!payload.productId) {
    return NextResponse.json({ error: 'productId is required to remove an item.' }, { status: 400 });
  }

  const { error } = await adminClient!
    .from('cart_items')
    .delete()
    .eq('user_id', auth.user.id)
    .eq('product_id', payload.productId);

  if (error) {
    console.error('[Cart API] Error removing cart item:', error);
    return NextResponse.json({ error: 'Unable to remove item.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
