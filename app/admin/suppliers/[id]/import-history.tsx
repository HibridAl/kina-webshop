'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { SupplierImportRun } from '@/lib/types';

export function SupplierImportHistory({ supplierId }: { supplierId: string }) {
  const [history, setHistory] = useState<SupplierImportRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await fetch(`/api/admin/import?supplierId=${supplierId}`);
        const data = await response.json();
        if (data.success) {
          setHistory(data.history || []);
        } else if (data.history) {
          setHistory(data.history);
        }
      } catch (error) {
        console.error('Error loading import history:', error);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [supplierId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return <p className="text-muted-foreground text-sm">No import history available</p>;
  }

  return (
    <div className="space-y-3">
      {history.map((item) => (
        <div key={item.id} className="border border-border rounded-lg p-4 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-sm">
              {item.imported} imported, {item.failed} failed
            </p>
            <span className="text-xs text-muted-foreground">
              {new Date(item.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {item.import_type?.toUpperCase() ?? 'batch'} • {new Date(item.created_at).toLocaleTimeString()}
          </p>
          {item.errors && item.errors.length > 0 && (
            <ul className="text-[11px] text-destructive list-disc ml-4">
              {item.errors.slice(0, 3).map((error: string, idx: number) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
