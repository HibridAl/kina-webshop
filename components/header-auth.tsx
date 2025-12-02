'use client';

import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { getBrowserClient } from '@/lib/supabase';
import { LocalizedText } from '@/components/ui/localized-text';

export function HeaderAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, profile, loading } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const currentPath = useMemo(() => {
    const query = searchParams?.toString();
    if (query) {
      return `${pathname}?${query}`;
    }
    return pathname;
  }, [pathname, searchParams]);

  const authHrefSuffix = encodeURIComponent(currentPath);
  const loginHref = `/auth/login?next=${authHrefSuffix}`;
  const registerHref = `/auth/register?next=${authHrefSuffix}`;

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const client = getBrowserClient();
      await client.auth.signOut();
      router.refresh();
    } catch (error) {
      console.error('Sign out failed', error);
    } finally {
      setSigningOut(false);
    }
  };

  const userInitial = (profile?.email ?? user?.email ?? 'A').charAt(0).toUpperCase();

  if (loading) {
    return <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />;
  }

  if (user) {
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-2 py-1 text-sm shadow-sm transition hover:border-border">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {userInitial}
            </span>
            <span className="hidden text-left leading-tight md:block">
              <span className="block text-xs text-muted-foreground">
                {profile?.role === 'admin' ? 'Admin' : 'Account'}
              </span>
              <span className="block max-w-[140px] truncate text-sm font-medium">
                {profile?.email ?? user.email}
              </span>
            </span>
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" sideOffset={8} className="w-60 rounded-2xl border border-border/60 bg-popover p-2 shadow-2xl">
          <DropdownMenu.Label className="px-2 py-1 text-xs text-muted-foreground">
            <LocalizedText hu="Bejelentkezve mint " en="Signed in as " />
            {user.email}
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-border/70" />
          <DropdownMenu.Item asChild className="cursor-pointer rounded-xl px-2 py-2 text-sm hover:bg-muted/60">
            <Link href="/account">
              <LocalizedText hu="Fiók" en="Account" />
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className="cursor-pointer rounded-xl px-2 py-2 text-sm hover:bg-muted/60">
            <Link href="/orders">
              <LocalizedText hu="Rendelések" en="Orders" />
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild className="cursor-pointer rounded-xl px-2 py-2 text-sm hover:bg-muted/60">
            <Link href="/cart">
              <LocalizedText hu="Kosár" en="Cart" />
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border/70" />
          <DropdownMenu.Item
            className="cursor-pointer rounded-xl px-2 py-2 text-sm text-destructive hover:bg-destructive/10"
            onSelect={(event) => {
              event.preventDefault();
              handleSignOut();
            }}
          >
            {signingOut ? (
              <LocalizedText hu="Kijelentkezés…" en="Signing out…" />
            ) : (
              <LocalizedText hu="Kijelentkezés" en="Sign out" />
            )}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    );
  }

  return (
    <div className="hidden items-center gap-2 md:flex">
      <Button variant="ghost" size="sm" className="text-sm" asChild>
        <Link href={loginHref}>
          <LocalizedText hu="Bejelentkezés" en="Sign in" />
        </Link>
      </Button>
      <Button size="sm" className="rounded-full bg-primary text-primary-foreground" asChild>
        <Link href={registerHref}>
          <LocalizedText hu="Fiók létrehozása" en="Create account" />
        </Link>
      </Button>
    </div>
  );
}

export function MobileAuth({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const currentPath = useMemo(() => {
    const query = searchParams?.toString();
    if (query) {
      return `${pathname}?${query}`;
    }
    return pathname;
  }, [pathname, searchParams]);

  const authHrefSuffix = encodeURIComponent(currentPath);
  const loginHref = `/auth/login?next=${authHrefSuffix}`;
  const registerHref = `/auth/register?next=${authHrefSuffix}`;

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const client = getBrowserClient();
      await client.auth.signOut();
      router.refresh();
      onClose();
    } catch (error) {
      console.error('Sign out failed', error);
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
     return <div className="h-20 animate-pulse rounded-md bg-muted" />;
  }

  if (user) {
    return (
      <>
        <Button asChild variant="outline" onClick={onClose}>
          <Link href="/account">
            <LocalizedText hu="Fiók" en="Account" />
          </Link>
        </Button>
        <Button asChild variant="outline" onClick={onClose}>
          <Link href="/orders">
            <LocalizedText hu="Rendelések" en="Orders" />
          </Link>
        </Button>
        <Button variant="destructive" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? (
            <LocalizedText hu="Kijelentkezés…" en="Signing out…" />
          ) : (
            <LocalizedText hu="Kijelentkezés" en="Sign out" />
          )}
        </Button>
      </>
    );
  }

  return (
    <>
      <Button asChild variant="outline" onClick={onClose}>
        <Link href={loginHref}>
          <LocalizedText hu="Bejelentkezés" en="Sign in" />
        </Link>
      </Button>
      <Button className="bg-primary" asChild onClick={onClose}>
        <Link href={registerHref}>
          <LocalizedText hu="Fiók létrehozása" en="Create account" />
        </Link>
      </Button>
    </>
  );
}
