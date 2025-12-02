'use client';

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Search, Menu, Sparkles, ShieldCheck, Headphones, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OemSearchBar } from '@/components/oem-search-bar';
import { LanguageSelector } from '@/components/language-selector';
import { LocalizedText } from '@/components/ui/localized-text';
import { useLocale } from '@/hooks/use-locale';
import { SearchAutocomplete } from '@/components/search-autocomplete';
import { HeaderAuth, MobileAuth } from '@/components/header-auth';

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
  const { locale } = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

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
                <Suspense fallback={<div className="h-9 w-24 animate-pulse rounded-full bg-muted" />}>
                  <HeaderAuth />
                </Suspense>
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
            <Suspense fallback={<div className="h-20 animate-pulse rounded-md bg-muted" />}>
              <MobileAuth onClose={() => setMobileMenuOpen(false)} />
            </Suspense>
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

            <div className="space-y-4">
              <SearchAutocomplete
                placeholder={searchPlaceholder}
                autoFocus
                onClose={() => setCommandOpen(false)}
              />
              <div className="rounded-2xl border border-dashed border-border/70 p-4">
                <p className="text-xs uppercase text-muted-foreground">{oemBlockTitle}</p>
                <Suspense fallback={<div className="h-10 animate-pulse rounded-md bg-muted" />}>
                  <OemSearchBar className="mt-3" />
                </Suspense>
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
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
