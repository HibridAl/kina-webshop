'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface MarketingLayoutProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
  className?: string;
}

export function MarketingLayout({
  title,
  description,
  breadcrumbs,
  children,
  className,
}: MarketingLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-background pb-20', className)}>
      {/* Breadcrumbs */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            {breadcrumbs?.map((item, index) => (
              <div key={item.label} className="flex items-center">
                {item.href ? (
                  <Link href={item.href} className="hover:text-foreground transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{item.label}</span>
                )}
                {index < breadcrumbs.length - 1 && (
                  <ChevronRight className="h-4 w-4 mx-2" />
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Hero / Header */}
      <div className="bg-muted/10 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-balance">
            {title}
          </h1>
          {description && (
            <p className="mt-4 text-lg md:text-xl text-muted-foreground text-balance max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-primary hover:prose-a:underline">
          {children}
        </article>
      </div>
    </div>
  );
}
