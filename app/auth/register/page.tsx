'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getBrowserClient } from '@/lib/supabase';
import { ensureUserProfile } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError('Please enter an email and password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const client = getBrowserClient();
      const { data, error: signUpError } = await client.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.user) {
        try {
          await ensureUserProfile(data.user, { role: 'customer' });
        } catch (profileError) {
          console.error('Profile creation failed:', profileError);
        }
      }

      if (!data.session) {
        router.push(`/auth/login?next=${encodeURIComponent(redirectTo)}`);
        return;
      }

      router.push(redirectTo);
    } catch (err: any) {
      console.error('Registration failed', err);
      setError(err?.message || 'Unable to sign up right now.');
    } finally {
      setLoading(false);
    }
  };

  const nextQuery = searchParams.get('next');
  const loginHref = nextQuery && nextQuery.startsWith('/')
    ? `/auth/login?next=${encodeURIComponent(nextQuery)}`
    : '/auth/login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-bold">Create your AutoHub account</h1>
          <p className="text-sm text-muted-foreground">
            Track orders, save vehicles, and access exclusive offers.
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
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat password"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                autoComplete="new-password"
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
                  Creating account...
                </>
              ) : (
                'Register'
              )}
            </Button>
          </form>

          <div className="text-sm text-muted-foreground text-center">
            Already have an account?{' '}
            <Link href={loginHref} className="text-accent hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
