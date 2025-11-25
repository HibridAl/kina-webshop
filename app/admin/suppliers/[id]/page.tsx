'use client';

import { useEffect, useState } from 'react';
import { getSuppliers } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { SupplierImportHistory } from './import-history';
import type { Supplier } from '@/lib/types';
import Link from 'next/link';
import { RefreshCw, ChevronLeft } from 'lucide-react';

export default function SupplierDetailPage({ params }: { params: { id: string } }) {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSupplier() {
      try {
        const suppliers = await getSuppliers();
        const found = suppliers.find((s) => s.id === params.id);
        setSupplier(found || null);
      } catch (error) {
        console.error('Error loading supplier:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSupplier();
  }, [params.id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!supplier) return <div className="p-8">Supplier not found</div>;

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/suppliers">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Supplier Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{supplier.name}</h1>
              {supplier.import_type && (
                <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
                  {supplier.import_type}
                </span>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Import Type</p>
                <p className="font-semibold capitalize">{supplier.import_type || 'Not configured'}</p>
              </div>

              {supplier.api_identifier && (
                <div>
                  <p className="text-sm text-muted-foreground">API Identifier</p>
                  <p className="font-mono text-sm">{supplier.api_identifier}</p>
                </div>
              )}

              {supplier.api_endpoint && (
                <div>
                  <p className="text-sm text-muted-foreground">API Endpoint</p>
                  <p className="font-mono text-sm bg-muted p-2 rounded break-all">
                    {supplier.api_endpoint}
                  </p>
                </div>
              )}

              {(supplier.contact_name || supplier.contact_email) && (
                <div>
                  <p className="text-sm text-muted-foreground">Primary Contact</p>
                  <p className="font-medium">{supplier.contact_name || '—'}</p>
                  {supplier.contact_email && (
                    <a href={`mailto:${supplier.contact_email}`} className="text-sm text-accent underline">
                      {supplier.contact_email}
                    </a>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Last Synced</p>
                <p className="font-semibold">
                  {supplier.last_synced
                    ? new Date(supplier.last_synced).toLocaleString()
                    : 'Never'}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <Button
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                asChild
              >
                <Link href="/admin/suppliers/import">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Import Products
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Import History */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Import History</h2>
            <SupplierImportHistory supplierId={supplier.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
