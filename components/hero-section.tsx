import Link from 'next/link';
import { ChevronRight, ArrowUpRight, Gauge, BatteryCharging, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocalizedText } from '@/components/ui/localized-text';

const stats = [
  {
    label: { en: 'OEM references synced', hu: 'Szinkronizált OEM hivatkozások' },
    value: '18k+',
    subcopy: { en: 'Verified weekly', hu: 'Heti frissítéssel ellenőrizve' },
  },
  {
    label: { en: 'Fleet customers onboarded', hu: 'Aktív flottapartnerek' },
    value: '220',
    subcopy: { en: 'Asia + EU', hu: 'Ázsia + EU' },
  },
  {
    label: { en: 'Avg. dispatch speed', hu: 'Átlagos kiszállítás indítása' },
    value: '< 48h',
    subcopy: { en: 'Priority lanes', hu: 'Gyorsított logisztikai csatornák' },
  },
];

const highlights = [
  {
    icon: <Gauge className="h-4 w-4" />,
    title: { en: 'Dynamic compatibility', hu: 'Dinamikus kompatibilitás' },
    copy: {
      en: 'Vehicle selector pairs SKU data with telemetry-backed fitment.',
      hu: 'A járműválasztó a SKU-adatokat telemetria alapú illeszkedési adatokkal párosítja a hibátlan kompatibilitásért.',
    },
  },
  {
    icon: <BatteryCharging className="h-4 w-4" />,
    title: { en: 'EV-first fluids', hu: 'EV-fókuszú folyadékok' },
    copy: {
      en: 'Curated lubricants, brake fluids, and coolants per MG/BYD spec.',
      hu: 'Gondosan válogatott kenőanyagok, fékfolyadékok és hűtőfolyadékok MG/BYD gyári előírás szerint.',
    },
  },
  {
    icon: <ShieldCheck className="h-4 w-4" />,
    title: { en: 'QC certificates', hu: 'Minőségi tanúsítványok' },
    copy: {
      en: 'Every kit includes supplier authenticity + warranty coverage.',
      hu: 'Minden készlethez beszállítói eredettanúsítvány és garanciális dokumentáció tartozik.',
    },
  },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background/60 to-background py-16 md:py-24">
      <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-to-br from-accent/20 via-transparent to-primary/20 blur-3xl" aria-hidden />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="relative z-10 space-y-8">
          <div className="flex flex-wrap gap-2">
            <Badge className="flex items-center gap-1 rounded-full bg-accent/15 text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              <LocalizedText hu="EV-első alkatrész piactér" en="EV-first marketplace" />
            </Badge>
            <Badge variant="outline" className="rounded-full">
              <LocalizedText hu="Élő készletadatok és OEM információk" en="Live inventory & OEM data" />
            </Badge>
          </div>

          <div className="space-y-6 text-balance">
            <h1 className="text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              <LocalizedText
                hu="Modern beszerzés MG, BYD, Omoda és Geely flottákhoz."
                en="Modern sourcing for MG, BYD, Omoda & Geely fleets."
              />
            </h1>
            <p className="text-lg text-muted-foreground">
              <LocalizedText
                hu="Az AutoHub egyesíti a hiteles kínai EV alkatrészeket, a prediktív készletinformációkat és az azonnali OEM-konverziókat, hogy a szervizsávok soha ne álljanak le."
                en="AutoHub unifies authentic Chinese EV parts, predictive availability, and instant OEM conversions so your service lanes never pause."
              />
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Link href="/products">
                <LocalizedText hu="Katalógus böngészése" en="Shop the catalog" />
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full border-border/70">
              <Link href="/brands" className="flex items-center">
                <LocalizedText hu="Ismerje meg OEM partnereinket" en="Meet our OEM partners" />
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-lg">
            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label.en} className="rounded-2xl bg-muted/50 p-4 text-center">
                  <div className="text-3xl font-semibold text-primary">{stat.value}</div>
                  <p className="text-sm font-medium">
                    <LocalizedText hu={stat.label.hu} en={stat.label.en} />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <LocalizedText hu={stat.subcopy.hu} en={stat.subcopy.en} />
                  </p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {highlights.map((item) => (
                <div key={item.title.en} className="rounded-2xl border border-dashed border-border/80 p-4 text-sm">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary">
                    {item.icon}
                    <LocalizedText hu={item.title.hu} en={item.title.en} />
                  </div>
                  <p className="text-muted-foreground">
                    <LocalizedText hu={item.copy.hu} en={item.copy.en} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <div className="glass-panel animate-float-slow rounded-[32px] border border-border/70 p-6 shadow-2xl">
            <div className="rounded-[24px] border border-border/70 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6">
              <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  <LocalizedText hu="Irányítópult" en="Command center" />
                </span>
                <span className="inline-flex items-center gap-2 text-xs text-primary">
                  <LocalizedText hu="Valós idejű szinkron" en="Realtime sync" />
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                </span>
              </div>
              <img
                src="/placeholder.svg?height=420&width=560&text=AutoHub+Command+Center"
                alt="AutoHub operations dashboard"
                className="h-64 w-full rounded-2xl border border-border/80 object-cover"
              />
              <div className="mt-6 grid gap-3 text-sm">
                <div className="flex items-center justify-between rounded-2xl bg-background/70 px-4 py-3">
                  <div>
                    <p className="font-semibold">
                      <LocalizedText hu="OEM kereszt-hivatkozás" en="OEM Crosswalk" />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <LocalizedText hu="212 új OEM hivatkozás ezen a héten" en="212 new references this week" />
                    </p>
                  </div>
                  <Badge variant="accent">
                    <LocalizedText hu="Automatikus" en="Auto" />
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-background/70 px-4 py-3">
                  <div>
                    <p className="font-semibold">
                      <LocalizedText hu="Flottavédelem" en="Fleet protections" />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <LocalizedText
                        hu="Garancia-adatok szinkronizálása Supabase segítségével"
                        en="Warranty sync w/ Supabase"
                      />
                    </p>
                  </div>
                  <Badge variant="outline" className="text-primary">
                    <LocalizedText hu="Aktív" en="Live" />
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
