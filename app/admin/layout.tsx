'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/admin-header';
import { AdminSidebar } from '@/components/admin-sidebar';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LocalizedText } from '@/components/ui/localized-text';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  
  const supabaseReady =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    if (authLoading) return;

    // 1. Supabase not configured: Check legacy local storage mock
    if (!supabaseReady) {
      const legacyAdmin = typeof window !== 'undefined' && localStorage.getItem('admin-user') === 'true';
      if (!legacyAdmin) {
        router.replace('/admin/login');
      } else {
        setIsAuthorized(true);
      }
      setChecking(false);
      return;
    }

    // 2. Not logged in: Redirect to login
    if (!user) {
      router.replace('/auth/login?next=/admin');
      return;
    }

    // 3. Logged in: Check Role
    if (profile?.role === 'admin') {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
    setChecking(false);
  }, [authLoading, profile, router, supabaseReady, user]);

  if (checking || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-6">
        <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>
        <div className="max-w-md space-y-2">
          <h1 className="text-2xl font-bold">
            <LocalizedText hu="Hozzáférés megtagadva" en="Access Denied" />
          </h1>
          <p className="text-muted-foreground">
            <LocalizedText 
              hu="Ön nem rendelkezik a szükséges jogosultságokkal az adminisztrációs felület megtekintéséhez."
              en="You do not have permission to access the administration dashboard."
            />
          </p>
        </div>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link href="/">
              <LocalizedText hu="Vissza a főoldalra" en="Back to Home" />
            </Link>
          </Button>
          {user && (
            <Button asChild variant="ghost">
              <Link href="/account">
                <LocalizedText hu="Fiókom" en="My Account" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
