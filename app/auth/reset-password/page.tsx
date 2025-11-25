'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-bold">Reset password</h1>
          <p className="text-sm text-muted-foreground">
            Enter the email tied to your AutoHub account. We&apos;ll send reset instructions shortly.
          </p>
        </div>

        <Card className="p-6 space-y-6">
          {!submitted ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                  autoComplete="email"
                />
              </div>
              <div className="flex gap-3 p-3 rounded-lg bg-muted/40 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                Password reset emails are being wired up. For urgent help, reach out to support@autohub.com.
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading || !email}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  'Send reset link'
                )}
              </Button>
            </form>
          ) : (
            <div className="flex flex-col items-center text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <div>
                <h2 className="text-xl font-semibold mb-1">Check your inbox</h2>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll email {email} with the next steps as soon as the reset service is active.
                </p>
              </div>
              <Button variant="outline" onClick={() => setSubmitted(false)}>
                Send to a different email
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
