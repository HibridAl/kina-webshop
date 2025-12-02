'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { LocalizedText } from '@/components/ui/localized-text';
import { cn } from '@/lib/utils';

// Mock helper until backend T-22 is ready
async function toggleWishlistItem(productId: string, isSaved: boolean): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 400));
  return !isSaved;
}

interface WishlistButtonProps {
  productId: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  withLabel?: boolean;
}

export function WishlistButton({ productId, variant = 'ghost', size = 'icon', className, withLabel = false }: WishlistButtonProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isSaved, setIsSaved] = useState(false); 
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating if inside a link
    e.stopPropagation();

    if (authLoading) return;

    if (!user) {
      const next = encodeURIComponent(window.location.pathname);
      router.push(`/auth/login?next=${next}`);
      return;
    }

    setIsPending(true);
    try {
      const newState = await toggleWishlistItem(productId, isSaved);
      setIsSaved(newState);
      
      if (newState) {
        toast.success('Added to wishlist');
      } else {
        toast.success('Removed from wishlist');
      }
      
      router.refresh();
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
      toast.error('Failed to update wishlist');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className, isSaved && "text-red-500 hover:text-red-600")}
      onClick={handleToggle}
      disabled={isPending || authLoading}
      aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={cn("h-4 w-4", isSaved && "fill-current")} />
      )}
      {withLabel && (
        <span className="ml-2">
          {isSaved ? (
            <LocalizedText hu="Mentve" en="Saved" />
          ) : (
            <LocalizedText hu="Mentés" en="Save" />
          )}
        </span>
      )}
    </Button>
  );
}
