import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getServiceSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ('errorResponse' in auth) return auth.errorResponse;

  const supabase = getServiceSupabase();
  const body = await request.json().catch(() => null);
  if (!body?.action || !Array.isArray(body.product_ids) || body.product_ids.length === 0) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  switch (body.action) {
    case 'update_price':
      return handlePriceUpdate(supabase, body.product_ids, body.payload);
    case 'update_status':
      return handleStatusUpdate(supabase, body.product_ids, body.payload);
    default:
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  }
}

async function handlePriceUpdate(supabase: ReturnType<typeof getServiceSupabase>, ids: string[], payload: any) {
  const price = Number(payload?.price);
  if (Number.isNaN(price)) {
    return NextResponse.json({ error: 'price is required' }, { status: 400 });
  }
  const { error } = await supabase.from('products').update({ price }).in('id', ids);
  if (error) {
    return NextResponse.json({ error: 'Bulk price update failed' }, { status: 500 });
  }
  return NextResponse.json({ success: true, processed: ids.length });
}

async function handleStatusUpdate(supabase: ReturnType<typeof getServiceSupabase>, ids: string[], payload: any) {
  const status = payload?.status;
  if (!status) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 });
  }
  const { error } = await supabase.from('products').update({ status }).in('id', ids);
  if (error) {
    return NextResponse.json({ error: 'Bulk status update failed' }, { status: 500 });
  }
  return NextResponse.json({ success: true, processed: ids.length });
}
