'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-6">
        <AlertCircle className="w-16 h-16 mx-auto text-destructive opacity-80" />
        <div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong!</h1>
          <p className="text-muted-foreground">
            We encountered an error while processing your request. Please try again.
          </p>
        </div>
        <div className="space-y-2">
          <Button
            onClick={reset}
            size="lg"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            Try Again
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <a href="/">Back to Home</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
