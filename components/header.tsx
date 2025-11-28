'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ShoppingCart, Search, Menu, Sparkles, ShieldCheck, Headphones, ChevronRight, X } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { OemSearchBar } from '@/components/oem-search-bar';
import { useAuth } from '@/hooks/use-auth';
import { getBrowserClient } from '@/lib/supabase';
import { LanguageSelector } from '@/components/language-selector';
import { LocalizedText } from '@/components/ui/localized-text';
import { useLocale } from '@/hooks/use-locale';

type LocalizedString = {
  hu: string;
  en: string;
};

const navLinks = [
  {
    href: '/products',
    label: { hu: 'Katalógus', en: 'Catalog' },
    description: { hu: 'Minden kategória és csomag', en: 'All categories & bundles' },
  },
  {
    href: '/brands',
    label: { hu: 'Márkák', en: 'Brands' },
    description: { hu: 'MG, BYD, Geely, Omoda', en: 'MG, BYD, Geely, Omoda' },
  },
  {
    href: '/vehicles',
    label: { hu: 'Járművek', en: 'Vehicles' },
    description: { hu: 'Kompatibilitási könyvtár', en: 'Compatibility library' },
  },
  {
    href: '/account',
    label: { hu: 'Fiók', en: 'Account' },
    description: { hu: 'Rendelések és mentések', en: 'Orders & saved builds' },
  },
];

const announcement = {
  message: {
    hu: 'Új EU-elosztóközpont – <48 órás kiszállítás MG és BYD flottáknak.',
    en: 'New EU fulfillment hub now live – <48h ship for MG & BYD fleets.',
  },
  cta: { hu: 'Szállítás követése', en: 'Track fulfillment' },
  href: '/products',
};

const quickActions = [
  { label: { hu: 'Olaj- és folyadékmátrix', en: 'View EV fluids matrix' }, href: '/oil-selector' },
  { label: { hu: 'OEM → SKU konverzió', en: 'Convert OEM → SKU' }, href: '/products?oem=' },
  { label: { hu: 'Kapcsolat a beszerzéssel', en: 'Talk to sourcing' }, href: 'mailto:sourcing@autohub.com' },
];

const badgeCopy = [
  {
    icon: Sparkles,
    label: { hu: 'Gyorsított MG EV beszerzés', en: 'Fastest MG EV sourcing desk' },
  },
  {
    icon: ShieldCheck,
    label: { hu: 'OEM-hitelesített katalógus', en: 'OEM verified catalog' },
  },
  {
    icon: Headphones,
    label: { hu: '0-24 flottatámogatás', en: '24/7 fleet support' },
  },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();
  const { locale } = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
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
  const searchPlaceholder =
    locale === 'hu'
      ? 'Termékek, SKU-k vagy járműkulcsszavak keresése'
      : 'Search products, SKUs, or vehicle keywords';
  const commandTitle = locale === 'hu' ? 'Univerzális kereső' : 'Universal search';
  const commandDescription =
    locale === 'hu'
      ? 'Ugorjon azonnal termékekhez, OEM keresésekhez vagy járművekhez.'
      : 'Instantly jump to products, OEM lookups, or vehicles.';
  const oemBlockTitle = locale === 'hu' ? 'OEM vagy SKU keresés' : 'OEM or SKU search';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
    setCommandOpen(false);
  };

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((prev) => !prev);
      }
      if (event.key === 'Escape') {
        setCommandOpen(false);
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

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
    <header className="sticky top-0 z-50 w-full">
      <div className="bg-primary text-primary-foreground border-b border-primary-foreground/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1 text-xs font-medium sm:px-6 lg:px-8">
          <p className="text-balance">
            <LocalizedText hu={announcement.message.hu} en={announcement.message.en} />
          </p>
          <Link href={announcement.href} className="hidden items-center gap-1 text-[11px] uppercase tracking-wide sm:inline-flex">
            <LocalizedText hu={announcement.cta.hu} en={announcement.cta.en} />
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="relative flex items-center gap-3">
              <div className="glow-border relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/80 to-primary text-white font-bold">
                AH
              </div>
              <div className="hidden flex-col text-sm font-semibold leading-tight text-foreground sm:flex">
                <span>AutoHub</span>
                <span className="text-xs font-normal text-muted-foreground">Precision parts cloud</span>
              </div>
            </Link>

            <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex flex-col gap-0.5 rounded-2xl border border-transparent px-3 py-1.5 text-sm transition hover:border-border/80 hover:bg-muted/40 lg:px-4 lg:py-2"
                >
                  <span className="font-medium group-hover:text-primary">
                    <LocalizedText hu={link.label.hu} en={link.label.en} />
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    <LocalizedText hu={link.description.hu} en={link.description.en} />
                  </span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <LanguageSelector />
              <Button
                variant="outline"
                size="sm"
                className="hidden rounded-full border-border/80 bg-background/70 text-sm text-muted-foreground shadow-sm hover:text-foreground md:inline-flex"
                onClick={() => setCommandOpen(true)}
              >
                <Search className="h-4 w-4" />
                <LocalizedText hu="Gyors keresés" en="Quick search" />
                <span className="rounded-full bg-muted px-1.5 text-[10px] uppercase tracking-widest">⌘K</span>
              </Button>

              <Button variant="ghost" size="icon" asChild className="rounded-full border border-border/70">
                <Link href="/cart" aria-label="Open cart">
                  <ShoppingCart className="h-5 w-5" />
                </Link>
              </Button>

              <div className="hidden md:flex items-center gap-2">
                {authLoading ? (
                  <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
                ) : user ? (
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
                ) : (
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
                )}
              </div>

              <Button
                variant="outline"
                size="icon"
                className="flex md:hidden"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label="Toggle navigation"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          <div className="hidden gap-3 md:flex">
            {badgeCopy.map((item, index) => {
              const Icon = item.icon;
              const variant = index === 0 ? 'accent' : index === 1 ? 'outline' : 'secondary';
              return (
                <Badge key={item.label.en} variant={variant} className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5" />
                  <LocalizedText hu={item.label.hu} en={item.label.en} />
                </Badge>
              );
            })}
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border/70 bg-background/95 px-5 pb-6 pt-5 shadow-lg">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl border border-border/70 px-4 py-3 text-sm font-medium hover:border-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div>
                  <LocalizedText hu={link.label.hu} en={link.label.en} />
                </div>
                <p className="text-xs text-muted-foreground">
                  <LocalizedText hu={link.description.hu} en={link.description.en} />
                </p>
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            {user ? (
              <>
                <Button asChild variant="outline" onClick={() => setMobileMenuOpen(false)}>
                  <Link href="/account">
                    <LocalizedText hu="Fiók" en="Account" />
                  </Link>
                </Button>
                <Button asChild variant="outline" onClick={() => setMobileMenuOpen(false)}>
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
            ) : (
              <>
                <Button asChild variant="outline" onClick={() => setMobileMenuOpen(false)}>
                  <Link href={loginHref}>
                    <LocalizedText hu="Bejelentkezés" en="Sign in" />
                  </Link>
                </Button>
                <Button className="bg-primary" asChild onClick={() => setMobileMenuOpen(false)}>
                  <Link href={registerHref}>
                    <LocalizedText hu="Fiók létrehozása" en="Create account" />
                  </Link>
                </Button>
              </>
            )}
          </div>
          <div className="mt-6 space-y-3 rounded-2xl border border-border/70 p-4 text-sm">
            {quickActions.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-foreground"
              >
                <LocalizedText hu={item.label.hu} en={item.label.en} />
                <ChevronRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {commandOpen && (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-background/80 px-4 py-10 backdrop-blur-lg" onClick={() => setCommandOpen(false)}>
          <div
            className="glass-panel relative w-full max-w-2xl rounded-3xl border border-border/70 bg-card/90 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4">
              <div>
                <p className="text-sm font-semibold">{commandTitle}</p>
                <p className="text-xs text-muted-foreground">{commandDescription}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setCommandOpen(false)} aria-label="Close search overlay">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                leadingIcon={<Search className="h-4 w-4" />}
              />
              <div className="rounded-2xl border border-dashed border-border/70 p-4">
                <p className="text-xs uppercase text-muted-foreground">{oemBlockTitle}</p>
                <OemSearchBar className="mt-3" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {quickActions.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl border border-border/60 p-3 text-sm transition hover:border-primary"
                    onClick={() => setCommandOpen(false)}
                  >
                    <LocalizedText hu={item.label.hu} en={item.label.en} />
                  </Link>
                ))}
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
