import { NextResponse } from 'next/server';
import { getServiceSupabase } from './supabase-server';

export async function requireAdmin(request: Request) {
  const supabase = getServiceSupabase();
  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return { errorResponse: NextResponse.json({ error: 'Authorization required.' }, { status: 401 }) };
  }

  const token = header.slice(7);
  const { data: authResult, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authResult?.user) {
    return { errorResponse: NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', authResult.user.id)
    .maybeSingle();

  if (profileError) {
    return { errorResponse: NextResponse.json({ error: 'Unable to verify permissions.' }, { status: 500 }) };
  }

  if (!profile || profile.role !== 'admin') {
    return { errorResponse: NextResponse.json({ error: 'Admin access required.' }, { status: 403 }) };
  }

  return { user: authResult.user, profile };
}
