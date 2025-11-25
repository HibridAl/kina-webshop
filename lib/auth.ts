import type { User } from '@supabase/supabase-js';
import { getBrowserClient } from './supabase';
import type { User as Profile } from './types';

export function isSupabaseReady(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

/**
 * Ensure a profile row exists for the Supabase auth user.
 * Defaults to role "customer" and non-B2B.
 */
export async function ensureUserProfile(user: User, overrides?: Partial<Profile>) {
  const client = getBrowserClient();

  const { data, error } = await client
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  // If found, nothing to do
  if (data?.id) return;

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  await client.from('users').insert({
    id: user.id,
    email: user.email,
    role: overrides?.role ?? 'customer',
    company_name: overrides?.company_name ?? null,
    is_b2b: overrides?.is_b2b ?? false,
  });
}
