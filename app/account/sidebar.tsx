'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { LocalizedText } from '@/components/ui/localized-text';
import { ACCOUNT_NAV_ITEMS } from './nav-config';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

export function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

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

  return (
    <nav className="flex flex-col space-y-1 w-full md:w-64 pr-0 md:pr-8">
      {ACCOUNT_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="w-4 h-4" />
            <LocalizedText hu={item.label.hu} en={item.label.en} />
          </Link>
        );
      })}
      
      <div className="pt-4 mt-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            <LocalizedText hu="Kijelentkezés" en="Sign out" />
          </span>
        </Button>
      </div>
    </nav>
  );
}
