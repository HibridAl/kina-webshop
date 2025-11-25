'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { getBrowserClient } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('admin@autohub.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const ADMIN_PASSWORD = 'admin123';
  const supabaseReady =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If already admin, redirect
  if (!authLoading && profile?.role === 'admin') {
    router.push('/admin/dashboard');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (supabaseReady) {
        // Treat this form as admin login via Supabase email/password
        const client = getBrowserClient();
        const { error: signInError } = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;

        // After sign-in, profile role check happens in layout; just redirect
        router.push('/admin/dashboard');
      } else {
        // Legacy local fallback
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (password === ADMIN_PASSWORD) {
          localStorage.setItem('admin-user', 'true');
          router.push('/admin/dashboard');
        } else {
          setError('Invalid admin password');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Login</h1>
          <p className="text-muted-foreground">
            {supabaseReady
              ? 'Sign in with your admin Supabase account'
              : 'Enter admin password to continue'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border p-8 rounded-lg">
          {error && (
            <div className="flex gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {supabaseReady && (
            <div>
              <label className="block text-sm font-medium mb-2">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@autohub.com"
                className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Admin Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
              disabled={loading}
            />
            {!supabaseReady && (
              <p className="text-xs text-muted-foreground mt-2">Demo password: admin123</p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {loading ? 'Logging in...' : 'Login to Admin Panel'}
          </Button>
        </form>
      </div>
    </div>
  );
}
