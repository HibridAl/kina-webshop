'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ShoppingCart, Search, Menu } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button } from '@/components/ui/button';
import { OemSearchBar } from '@/components/oem-search-bar';
import { useAuth } from '@/hooks/use-auth';
import { getBrowserClient } from '@/lib/supabase';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed.length === 0) return;
    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
    setSearchOpen(false);
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const client = getBrowserClient();
      await client.auth.signOut();
      router.refresh();
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Sign out failed', error);
    } finally {
      setSigningOut(false);
    }
  };

  const userInitial = (profile?.email ?? user?.email ?? 'A').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-accent-foreground font-bold">
              A
            </div>
            <span className="text-xl font-bold text-primary hidden sm:inline">AutoHub</span>
          </Link>

          {/* Nav Links - Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/brands" className="text-sm font-medium hover:text-accent transition-colors">
              Brands
            </Link>
            <Link href="/products" className="text-sm font-medium hover:text-accent transition-colors">
              Products
            </Link>
            <Link href="/about" className="text-sm font-medium hover:text-accent transition-colors">
              About
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen((prev) => !prev)}
              aria-label="Search products"
            >
              <Search className="w-5 h-5" />
            </Button>

            <div className="hidden md:flex items-center gap-2">
              {authLoading ? (
                <div className="w-24 h-9 rounded-full bg-muted animate-pulse" />
              ) : user ? (
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      className="flex items-center gap-2 rounded-full border border-border px-2 py-1 text-sm hover:bg-muted"
                      aria-label="Open account menu"
                    >
                      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                        {userInitial}
                      </span>
                      <span className="text-left">
                        <span className="block leading-tight text-xs text-muted-foreground">
                          {profile?.role === 'admin' ? 'Admin' : 'Account'}
                        </span>
                        <span className="block leading-tight text-sm font-medium truncate max-w-[140px]">
                          {profile?.email ?? user.email}
                        </span>
                      </span>
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="w-56 rounded-lg border border-border bg-popover shadow-lg p-2 text-sm"
                  >
                    <DropdownMenu.Label className="px-2 py-1 text-xs text-muted-foreground">
                      Signed in as {user.email}
                    </DropdownMenu.Label>
                    <DropdownMenu.Item asChild className="px-2 py-2 rounded-md cursor-pointer hover:bg-muted">
                      <Link href="/account">Account</Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild className="px-2 py-2 rounded-md cursor-pointer hover:bg-muted">
                      <Link href="/account/orders">Orders</Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item asChild className="px-2 py-2 rounded-md cursor-pointer hover:bg-muted">
                      <Link href="/cart">Cart</Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="my-1 h-px bg-border" />
                    <DropdownMenu.Item
                      className="px-2 py-2 rounded-md cursor-pointer hover:bg-destructive/10 text-destructive"
                      onSelect={(event) => {
                        event.preventDefault();
                        handleSignOut();
                      }}
                    >
                      {signingOut ? 'Signing out...' : 'Sign out'}
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={loginHref}>Sign in</Link>
                  </Button>
                  <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                    <Link href={registerHref}>Sign up</Link>
                  </Button>
                </>
              )}
            </div>

            <Button variant="ghost" size="icon" asChild>
              <Link href="/cart">
                <ShoppingCart className="w-5 h-5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="border-t border-border py-3 space-y-3">
            <div className="flex items-center gap-3">
              <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-3">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products or keywords"
                  className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="sm"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  Search
                </Button>
              </form>
            </div>
            <div className="flex items-center gap-3">
              <OemSearchBar className="flex-1" />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t">
            <nav className="flex flex-col gap-3 pt-4">
              <Link href="/brands" className="text-sm font-medium hover:text-accent transition-colors">
                Brands
              </Link>
              <Link href="/products" className="text-sm font-medium hover:text-accent transition-colors">
                Products
              </Link>
              <Link href="/about" className="text-sm font-medium hover:text-accent transition-colors">
                About
              </Link>
            </nav>
            <div className="mt-4 flex flex-col gap-2">
              {user ? (
                <>
                  <div className="text-xs text-muted-foreground">Signed in as {user.email}</div>
                  <Button asChild variant="outline" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/account">Account</Link>
                  </Button>
                  <Button asChild variant="outline" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/account/orders">Orders</Link>
                  </Button>
                  <Button variant="destructive" onClick={handleSignOut} disabled={signingOut}>
                    {signingOut ? 'Signing out...' : 'Sign out'}
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" onClick={() => setMobileMenuOpen(false)}>
                    <Link href={loginHref}>Sign in</Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href={registerHref}>Sign up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
