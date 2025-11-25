'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminHeader } from '@/components/admin-header';
import { AdminSidebar } from '@/components/admin-sidebar';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const warnedRef = useRef(false);
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const supabaseReady =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    if (!supabaseReady) {
      const legacyAdmin = localStorage.getItem('admin-user') === 'true';
      if (!legacyAdmin) {
        router.replace('/admin/login');
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }
      setLoading(false);
      return;
    }

    if (authLoading) return;

    if (!user) {
      router.replace('/auth/login?next=/admin');
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    if (profile?.role !== 'admin') {
      if (!warnedRef.current) {
        toast.error('Admin access required.');
        warnedRef.current = true;
      }
      router.replace('/');
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    setIsAuthorized(true);
    setLoading(false);
  }, [authLoading, profile, router, supabaseReady, user]);

  if (loading) return <div>Loading...</div>;
  if (!isAuthorized) return null;

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
