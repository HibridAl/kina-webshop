'use client';

import { AdminCompatibilityDashboard } from '@/components/admin-compatibility-dashboard';

export default function CompatibilityPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compatibility Coverage</h1>
        <p className="text-muted-foreground">
          Monitor parts coverage across supported vehicle brands.
        </p>
      </div>
      
      <AdminCompatibilityDashboard />
    </div>
  );
}
