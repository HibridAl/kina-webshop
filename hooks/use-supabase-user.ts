'use client';

import { useEffect, useState } from 'react';
import type { User, AuthChangeEvent, Session, AuthError } from '@supabase/supabase-js';
import { getBrowserClient } from '@/lib/supabase';

interface UseSupabaseUserResult {
  user: User | null;
  loading: boolean;
}

export function useSupabaseUser(): UseSupabaseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Supabase isn't configured, skip auth logic but don't break the UI
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      setLoading(false);
      return;
    }

    const client = getBrowserClient();

    let isMounted = true;

    client.auth
      .getUser()
      .then(({ data, error }: { data: { user: User | null }, error: AuthError | null }) => {
        if (!isMounted) return;
        if (error) {
          console.error('Error fetching Supabase user:', error);
          setUser(null);
        } else {
          setUser(data.user ?? null);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const {
      data: authListener,
    } = client.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}


