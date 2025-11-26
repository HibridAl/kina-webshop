import Link from 'next/link';
import { ChevronRight, ArrowUpRight, Gauge, BatteryCharging, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const stats = [
  { label: 'OEM references synced', value: '18k+', subcopy: 'Verified weekly' },
  { label: 'Fleet customers onboarded', value: '220', subcopy: 'Asia + EU' },
  { label: 'Avg. dispatch speed', value: '< 48h', subcopy: 'Priority lanes' },
];

const highlights = [
  {
    icon: <Gauge className="h-4 w-4" />,
    title: 'Dynamic compatibility',
    copy: 'Vehicle selector pairs SKU data with telemetry-backed fitment.',
  },
  {
    icon: <BatteryCharging className="h-4 w-4" />,
    title: 'EV-first fluids',
    copy: 'Curated lubricants, brake fluids, and coolants per MG/BYD spec.',
  },
  {
    icon: <ShieldCheck className="h-4 w-4" />,
    title: 'QC certificates',
    copy: 'Every kit includes supplier authenticity + warranty coverage.',
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
              EV-first marketplace
            </Badge>
            <Badge variant="outline" className="rounded-full">
              Live inventory & OEM data
            </Badge>
          </div>

          <div className="space-y-6 text-balance">
            <h1 className="text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              Modern sourcing for MG, BYD, Omoda & Geely fleets.
            </h1>
            <p className="text-lg text-muted-foreground">
              AutoHub unifies authentic Chinese EV parts, predictive availability, and instant OEM conversions so your service lanes never pause.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Link href="/products">
                Shop the catalog
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full border-border/70">
              <Link href="/brands" className="flex items-center">
                Meet our OEM partners
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 rounded-3xl border border-border/70 bg-card/80 p-6 shadow-lg">
            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-muted/50 p-4 text-center">
                  <div className="text-3xl font-semibold text-primary">{stat.value}</div>
                  <p className="text-sm font-medium">{stat.label}</p>
                  <p className="text-xs text-muted-foreground">{stat.subcopy}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {highlights.map((item) => (
                <div key={item.title} className="rounded-2xl border border-dashed border-border/80 p-4 text-sm">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary">
                    {item.icon}
                    {item.title}
                  </div>
                  <p className="text-muted-foreground">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <div className="glass-panel animate-float-slow rounded-[32px] border border-border/70 p-6 shadow-2xl">
            <div className="rounded-[24px] border border-border/70 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6">
              <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
                <span>Command center</span>
                <span className="inline-flex items-center gap-2 text-xs text-primary">
                  Realtime sync
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
                    <p className="font-semibold">OEM Crosswalk</p>
                    <p className="text-xs text-muted-foreground">212 new references this week</p>
                  </div>
                  <Badge variant="accent">Auto</Badge>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-background/70 px-4 py-3">
                  <div>
                    <p className="font-semibold">Fleet protections</p>
                    <p className="text-xs text-muted-foreground">Warranty sync w/ Supabase</p>
                  </div>
                  <Badge variant="outline" className="text-primary">
                    Live
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
