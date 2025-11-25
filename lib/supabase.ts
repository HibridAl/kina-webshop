import { createBrowserClient } from '@supabase/ssr';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserClient() {
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.error(
        'Supabase credentials missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
      );
      throw new Error('Supabase configuration incomplete');
    }

    browserClient = createBrowserClient(url, key);
  }
  return browserClient;
}

// For now, server code reuses the browser client so that this module
// can be safely imported from client components without relying on
// `next/headers` or other server-only APIs.
export async function getServerClient() {
  return getBrowserClient();
}
