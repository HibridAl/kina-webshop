'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { LocalizedText } from '@/components/ui/localized-text';

// Mock helper until backend T-13.3 is ready
// In real implementation, this would be in lib/db.ts or a dedicated hook
async function toggleGarageVehicle(vehicleId: string, isSaved: boolean): Promise<boolean> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // In MVP mock, we just return the inverted state
  return !isSaved;
}

interface VehicleSaveButtonProps {
  vehicleId: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function VehicleSaveButton({ vehicleId, variant = 'outline', size = 'default', className }: VehicleSaveButtonProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isSaved, setIsSaved] = useState(false); // Mock state
  const [isPending, setIsPending] = useState(false);

  // Mock: Check if saved on mount (in real app, fetch from API/Context)
  useEffect(() => {
    // For mock demo, let's pretend vehicle '123' is saved if needed
    // setIsSaved(false);
  }, [vehicleId]);

  const handleToggle = async () => {
    if (authLoading) return;

    if (!user) {
      // Redirect to login if guest
      const next = encodeURIComponent(window.location.pathname);
      router.push(`/auth/login?next=${next}`);
      return;
    }

    setIsPending(true);
    try {
      const newState = await toggleGarageVehicle(vehicleId, isSaved);
      setIsSaved(newState);
      
      if (newState) {
        toast.success('Vehicle saved to garage', {
          description: 'You can now quickly filter parts for this car.'
        });
      } else {
        toast.success('Vehicle removed from garage');
      }
      
      // Refresh header/garage context if we had one
      router.refresh();
    } catch (error) {
      console.error('Failed to toggle garage:', error);
      toast.error('Failed to save vehicle');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleToggle}
      disabled={isPending || authLoading}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={`h-4 w-4 ${isSaved ? 'fill-current text-red-500' : ''}`} />
      )}
      {size !== 'icon' && (
        <span className="ml-2">
          {isSaved ? (
            <LocalizedText hu="Mentve" en="Saved" />
          ) : (
            <LocalizedText hu="Mentés a garázsba" en="Save to Garage" />
          )}
        </span>
      )}
    </Button>
  );
}
