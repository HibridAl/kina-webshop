'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Linkedin, Twitter, ArrowUpRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocalizedText } from '@/components/ui/localized-text';
import { useLocale } from '@/hooks/use-locale';

export function Footer() {
  const { locale } = useLocale();
  const emailPlaceholder = locale === 'hu' ? 'Email cím' : 'Email address';
  const isoBadge = locale === 'hu' ? 'ISO/TS 22163 megfelelés' : 'ISO/TS 22163 ready';

  return (
    <footer className="mt-20 border-t border-border/60 bg-gradient-to-b from-background to-primary/5">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              AutoHub
            </div>
            <h3 className="text-3xl font-semibold leading-tight">
              <LocalizedText
                hu="Flottaszintű kereskedelem a kínai EV ökoszisztémákhoz."
                en="Fleet-grade commerce for Chinese EV ecosystems."
              />
            </h3>
            <p className="text-muted-foreground">
              <LocalizedText
                hu="Összekapcsoljuk az OEM katalógusokat, a Supabase-alapú telemetriát és az operatív eszközöket, hogy az utóértékesítési csapata zökkenőmentesen dolgozhasson."
                en="We stitch together OEM catalogs, Supabase-powered telemetry, and operational tooling so your aftersales teams can execute without friction."
              />
            </p>
            <div className="rounded-3xl border border-border/70 bg-card/70 p-6">
              <p className="text-sm font-semibold">
                <LocalizedText hu="Maradjon naprakész" en="Stay synced" />
              </p>
              <p className="text-sm text-muted-foreground">
                <LocalizedText
                  hu="Kapjon beszerzési útmutatókat, kompatibilitási értesítéseket és béta-hozzáférést."
                  en="Receive sourcing playbooks, compatibility alerts, and beta access."
                />
              </p>
              <form className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Input
                  type="email"
                  placeholder={emailPlaceholder}
                  required
                  className="flex-1 rounded-full border-border/80"
                />
                <Button type="submit" className="rounded-full">
                  <LocalizedText hu="Feliratkozás" en="Subscribe" />
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
              <p className="mt-2 text-xs text-muted-foreground">
                <LocalizedText
                  hu="Havonta egy frissítést küldünk. Bármikor leiratkozhat."
                  en="We send one update per month. Unsubscribe anytime."
                />
              </p>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                <LocalizedText hu="Navigáció" en="Navigation" />
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link href="/products" className="flex items-center gap-2 text-foreground transition hover:text-primary">
                    <LocalizedText hu="Katalógus" en="Catalog" />
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
                <li>
                  <Link href="/brands" className="flex items-center gap-2 text-foreground transition hover:text-primary">
                    <LocalizedText hu="Márkák" en="Brands" />
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
                <li>
                  <Link href="/vehicles" className="flex items-center gap-2 text-foreground transition hover:text-primary">
                    <LocalizedText hu="Járművek" en="Vehicles" />
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
                <li>
                  <Link href="/account" className="flex items-center gap-2 text-foreground transition hover:text-primary">
                    <LocalizedText hu="Fiók" en="Account" />
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                <LocalizedText hu="Kapcsolat" en="Contact" />
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>+1-800-AUTO-HUB</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>support@autohub.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Global distribution nodes</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="rounded-full" asChild>
                  <Link href="https://www.linkedin.com"> <Linkedin className="h-4 w-4" /> </Link>
                </Button>
                <Button variant="outline" size="icon" className="rounded-full" asChild>
                  <Link href="https://twitter.com"> <Twitter className="h-4 w-4" /> </Link>
                </Button>
              </div>
              <Badge variant="accent" className="rounded-full px-4 py-2">{isoBadge}</Badge>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border/60 pt-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            <LocalizedText hu="© " en="© " />
            {new Date().getFullYear()} AutoHub.{' '}
            <LocalizedText hu="Minden jog fenntartva." en="All rights reserved." />
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-primary">
              <LocalizedText hu="Adatvédelem" en="Privacy" />
            </Link>
            <Link href="/terms" className="hover:text-primary">
              <LocalizedText hu="Felhasználási feltételek" en="Terms" />
            </Link>
            <Link href="/cookies" className="hover:text-primary">
              <LocalizedText hu="Sütik" en="Cookies" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
