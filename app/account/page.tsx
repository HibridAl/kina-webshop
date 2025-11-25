'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getBrowserClient } from '@/lib/supabase';
import { Loader2, LogOut, Package, ShieldCheck, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const CTA_LINKS = [
  {
    title: 'Order history',
    description: 'Track shipping status, download invoices, and review past purchases.',
    href: '/account/orders',
    icon: Package,
    disabled: false,
  },
  {
    title: 'Saved vehicles',
    description: 'Pin VINs and trims you service often. Coming soon for beta testers.',
    href: '/account/garage',
    icon: Star,
    disabled: true,
  },
  {
    title: 'Account details',
    description: 'Update profile data, business info, and notification preferences.',
    href: '/account/details',
    icon: ShieldCheck,
    disabled: true,
  },
];

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login?next=/account');
    }
  }, [loading, router, user]);

  const greeting = useMemo(() => {
    const email = profile?.email ?? user?.email ?? '';
    if (!email) return 'there';
    return email.split('@')[0];
  }, [profile?.email, user?.email]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const client = getBrowserClient();
      await client.auth.signOut();
      router.replace('/auth/login?next=/account');
    } catch (error) {
      console.error('Sign out failed', error);
    } finally {
      setSigningOut(false);
    }
  };

  if (loading || (!user && typeof window !== 'undefined')) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Preparing your workspace...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Header />
      <main className="flex-1 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <section className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-transparent border border-border/60 p-8">
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Account</p>
            <h1 className="text-3xl md:text-4xl font-bold mt-2">Welcome back, {greeting || 'AutoHub partner'}!</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              Manage your MG, BYD, and Omoda programs from one dashboard. Review new orders, keep vehicle profiles handy,
              and update billing preferences before your next checkout.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/account/orders">Go to orders</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/products">Continue shopping</Link>
              </Button>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            {CTA_LINKS.map((cta) => {
              const Icon = cta.icon;
              return (
                <Card
                  key={cta.title}
                  className={cn(cta.disabled && 'opacity-70 border-dashed pointer-events-none')}
                >
                  <CardHeader className="space-y-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-xl">
                      {cta.title}
                      {cta.disabled ? ' (soon)' : ''}
                    </CardTitle>
                    <CardDescription>{cta.description}</CardDescription>
                  </CardHeader>
                  {!cta.disabled && (
                    <CardContent>
                      <Button asChild variant="outline" className="w-full">
                        <Link href={cta.href}>Open</Link>
                      </Button>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </section>

          <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Information tied to your AutoHub account.</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="font-medium text-foreground">{profile?.email ?? user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Role</dt>
                    <dd className="font-medium capitalize">{profile?.role ?? 'customer'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">User ID</dt>
                    <dd className="font-mono text-xs text-foreground/80">{user.id}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="font-medium">{profile?.is_b2b ? 'B2B partner' : 'Retail customer'}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Session</CardTitle>
                <CardDescription>Securely sign out across devices.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  {signingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Signing out...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 mr-2" /> Sign out
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
