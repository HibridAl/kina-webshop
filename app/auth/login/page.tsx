'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Loader2 } from 'lucide-react';
import { getBrowserClient } from '@/lib/supabase';
import { ensureUserProfile } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function AuthLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const redirectTo = useMemo(() => {
    const nextParam = searchParams.get('next');
    if (nextParam && nextParam.startsWith('/')) {
      return nextParam;
    }
    return '/account';
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!supabaseConfigured) {
      setError('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_* env vars to enable auth.');
      return;
    }

    if (!email || !password) {
      setError('Enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const client = getBrowserClient();
      const { data, error: signInError } = await client.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      if (data.user) {
        try {
          await ensureUserProfile(data.user);
        } catch (profileError) {
          console.error('Profile ensure failed:', profileError);
        }
      }
      router.push(redirectTo);
    } catch (err: any) {
      console.error('Login failed', err);
      setError(err?.message || 'Unable to sign in right now.');
    } finally {
      setLoading(false);
    }
  };

  const nextQuery = searchParams.get('next');
  const signUpHref = nextQuery && nextQuery.startsWith('/')
    ? `/auth/register?next=${encodeURIComponent(nextQuery)}`
    : '/auth/register';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-bold">Sign in to AutoHub</h1>
          <p className="text-sm text-muted-foreground">
            Access your saved vehicles, cart, and order history.
          </p>
        </div>

        <Card className="p-6 space-y-6">
          {error && (
            <div className="flex gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Password</label>
                <Link
                  href="/auth/reset-password"
                  className="text-xs text-accent hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading || !supabaseConfigured}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <div className="text-sm text-muted-foreground text-center">
            New to AutoHub?{' '}
            <Link href={signUpHref} className="text-accent hover:underline font-medium">
              Create an account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
