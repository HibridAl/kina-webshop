import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServiceSupabase } from '@/lib/supabase-server';
import { updateOrderStatus, OrderStatusTransitionError } from '@/lib/db';

const payloadSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  skipPaymentCheck: z.boolean().optional(),
});

async function requireAdmin(request: NextRequest) {
  const supabase = getServiceSupabase();
  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return {
      errorResponse: NextResponse.json({ error: 'Authorization required.' }, { status: 401 }),
    };
  }

  const token = header.slice(7);
  const { data: authResult, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authResult?.user) {
    return {
      errorResponse: NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', authResult.user.id)
    .maybeSingle();

  if (profileError) {
    console.error('[orders/status] Failed to load user profile:', profileError);
    return {
      errorResponse: NextResponse.json({ error: 'Unable to verify permissions.' }, { status: 500 }),
    };
  }

  if (!profile || profile.role !== 'admin') {
    return {
      errorResponse: NextResponse.json({ error: 'Admin access required.' }, { status: 403 }),
    };
  }

  return { supabase, userId: authResult.user.id };
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const orderId = context.params?.id;
  if (!orderId) {
    return NextResponse.json({ error: 'Missing order id.' }, { status: 400 });
  }

  const auth = await requireAdmin(request);
  if ('errorResponse' in auth) return auth.errorResponse;

  let payload: z.infer<typeof payloadSchema>;
  try {
    const body = await request.json();
    payload = payloadSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  try {
    const updatedOrder = await updateOrderStatus(orderId, payload.status, {
      skipPaymentCheck: payload.skipPaymentCheck,
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    if (error instanceof OrderStatusTransitionError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const code = error?.code ?? error?.status ?? null;
    if (code === 'PGRST116' || code === 'PGRST404' || error?.message?.includes('No rows')) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    console.error('[orders/status] Unexpected failure:', error);
    return NextResponse.json({ error: 'Unable to update order status.' }, { status: 500 });
  }
}
