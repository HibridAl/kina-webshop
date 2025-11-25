'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getBrowserClient } from '@/lib/supabase';
import { ensureUserProfile, isSupabaseReady } from '@/lib/auth';
import type { User as Profile } from '@/lib/types';

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export const AuthContext = createContext<AuthState | null>(null);

function supabaseReady() {
  return isSupabaseReady();
}

export function useProvideAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!supabaseReady()) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    const client = getBrowserClient();
    let isMounted = true;

    async function load() {
      try {
        const { data: sessionData, error: sessionError } = await client.auth.getSession();
        if (!isMounted) return;
        if (sessionError) throw sessionError;

        const session = sessionData.session;
        const user = session?.user ?? null;
        let profile: Profile | null = null;

        if (user) {
          let profileResult = await client
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (profileResult.error && profileResult.error.code !== 'PGRST116') {
            console.error('Error loading profile:', profileResult.error);
          }

          if (!profileResult.data) {
            // create a default profile if missing
            try {
              await ensureUserProfile(user);
              profileResult = await client
                .from('users')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();
            } catch (err) {
              console.error('Error ensuring profile:', err);
            }
          }

          if (profileResult.data) {
            profile = profileResult.data as Profile;
          }
        }

        setState({ user, session, profile, loading: false, error: null });
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Auth load error:', err);
        setState((prev) => ({ ...prev, loading: false, error: err?.message || 'Auth error' }));
      }
    }

    const { data: authListener } = client.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      setState((prev) => ({ ...prev, session: newSession, user: newSession?.user ?? null }));
      load();
    });

    load();

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (context) {
    return context;
  }
  return useProvideAuth();
}
