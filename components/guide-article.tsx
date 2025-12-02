'use client';

import { MarketingLayout } from '@/components/marketing-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { GuidePost } from '@/components/guide-card';

interface GuideArticleProps {
  post: GuidePost & {
    content: React.ReactNode; // or string if parsing markdown locally
    author?: {
      name: string;
      avatar?: string;
      role?: string;
    };
  };
}

export function GuideArticle({ post }: GuideArticleProps) {
  return (
    <MarketingLayout
      title={post.title}
      description={post.excerpt}
      breadcrumbs={[
        { label: 'Guides', href: '/guides' },
        { label: post.category, href: `/guides?category=${post.category.toLowerCase()}` },
        { label: post.title },
      ]}
    >
      {/* Author & Metadata Header */}
      <div className="not-prose flex items-center gap-4 mb-10 border-b border-border pb-8">
        {post.author && (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-foreground">{post.author.name}</p>
              <p className="text-xs text-muted-foreground">{post.author.role || 'Contributor'}</p>
            </div>
          </div>
        )}
        <div className="h-8 w-px bg-border mx-2" />
        <div className="text-sm text-muted-foreground">
          Published on {new Date(post.publishedAt).toLocaleDateString()}
        </div>
      </div>

      {/* Render Content */}
      {post.content}
    </MarketingLayout>
  );
}
