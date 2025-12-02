'use client';

import Link from 'next/link';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/button'; // Wait, Badge is in ui/badge
import { Badge as UiBadge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface GuidePost {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readTime: string;
  category: string;
  imageUrl?: string;
}

interface GuideCardProps {
  post: GuidePost;
  className?: string;
}

export function GuideCard({ post, className }: GuideCardProps) {
  return (
    <Link href={`/guides/${post.slug}`} className={cn("group flex flex-col h-full", className)}>
      <article className="relative flex flex-col h-full overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:shadow-lg hover:-translate-y-1">
        <div className="relative h-48 w-full overflow-hidden bg-muted">
          {post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt={post.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground/20">
              <span className="text-4xl font-bold">AH</span>
            </div>
          )}
          <div className="absolute top-4 left-4">
            <UiBadge variant="secondary" className="bg-background/90 backdrop-blur-sm">
              {post.category}
            </UiBadge>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </time>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{post.readTime}</span>
            </div>
          </div>

          <h3 className="text-xl font-bold leading-tight mb-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
            {post.excerpt}
          </p>

          <div className="flex items-center text-sm font-medium text-primary mt-auto">
            Read article <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </article>
    </Link>
  );
}
