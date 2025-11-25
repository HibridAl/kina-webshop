import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function HeroSection() {
  return (
    <div className="relative w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
              Premium Parts for Chinese Cars
            </h1>
            <p className="text-lg opacity-95 text-balance">
              Discover high-quality OEM and aftermarket parts for MG, BYD, Omoda, Geely, and Haval vehicles. Fast shipping, competitive pricing, expert support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/products">
                  Browse Products <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                <Link href="/brands">
                  View Brands
                </Link>
              </Button>
            </div>
          </div>

          {/* Image Placeholder */}
          <div className="relative h-80 md:h-96 bg-primary-foreground/10 rounded-lg flex items-center justify-center">
            <img
              src="/placeholder.svg?height=400&width=500"
              alt="Premium automotive parts"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
