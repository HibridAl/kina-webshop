'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AccountSidebar } from './sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login?next=/account');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row">
            <aside className="hidden md:block">
              <AccountSidebar />
            </aside>
            <div className="flex-1 min-w-0">
              {children}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
