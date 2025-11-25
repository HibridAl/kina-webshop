#!/usr/bin/env ts-node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx ts-node scripts/bootstrap-admin.ts user@example.com');
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error('Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const client = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: userProfile, error: profileError } = await client
    .from('users')
    .select('id, role')
    .eq('email', email)
    .maybeSingle();

  if (profileError) {
    console.error('Failed to look up profile:', profileError.message);
    process.exit(1);
  }

  if (!userProfile) {
    console.error('No profile found. Ask the user to sign up first, then retry this script.');
    process.exit(1);
  }

  const { error: updateError } = await client
    .from('users')
    .update({ role: 'admin', is_b2b: false })
    .eq('id', userProfile.id);

  if (updateError) {
    console.error('Failed to promote user:', updateError.message);
    process.exit(1);
  }

  console.log(`Promoted ${email} to admin.`);
}

main().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
