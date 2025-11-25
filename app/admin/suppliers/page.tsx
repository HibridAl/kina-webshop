'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Trash2, Edit, Plus, RefreshCw } from 'lucide-react';
import { getSuppliers } from '@/lib/db';
import type { Supplier } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { deleteSupplierAction, saveSupplierAction } from '@/app/admin/actions';

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [endpointInput, setEndpointInput] = useState('');
  const [importTypeInput, setImportTypeInput] = useState('');
  const [apiIdInput, setApiIdInput] = useState('');
  const [contactNameInput, setContactNameInput] = useState('');
  const [contactEmailInput, setContactEmailInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadSuppliers = useCallback(async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setFeedback('Unable to load suppliers. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const openCreateForm = () => {
    setFormMode('create');
    setEditingId(null);
    setNameInput('');
    setEndpointInput('');
    setImportTypeInput('');
     setApiIdInput('');
     setContactNameInput('');
     setContactEmailInput('');
    setFeedback(null);
    setShowForm(true);
  };

  const openEditForm = (supplier: Supplier) => {
    setFormMode('edit');
    setEditingId(supplier.id);
    setNameInput(supplier.name);
    setEndpointInput(supplier.api_endpoint ?? '');
    setImportTypeInput(supplier.import_type ?? '');
    setApiIdInput(supplier.api_identifier ?? '');
    setContactNameInput(supplier.contact_name ?? '');
    setContactEmailInput(supplier.contact_email ?? '');
    setFeedback(null);
    setShowForm(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!nameInput.trim()) {
      setFeedback('Supplier name is required.');
      return;
    }
    startTransition(async () => {
      const result = await saveSupplierAction({
        id: editingId ?? undefined,
        name: nameInput.trim(),
        api_endpoint: endpointInput.trim(),
        import_type: importTypeInput.trim() || null,
        api_identifier: apiIdInput.trim(),
        contact_name: contactNameInput.trim(),
        contact_email: contactEmailInput.trim(),
      });
      if (!result.success) {
        setFeedback(result.error ?? 'Failed to save supplier');
        return;
      }
      setShowForm(false);
      setFeedback(null);
      setEditingId(null);
      setApiIdInput('');
      setContactNameInput('');
      setContactEmailInput('');
      loadSuppliers();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this supplier?')) return;
    startTransition(async () => {
      const result = await deleteSupplierAction(id);
      if (!result.success) {
        setFeedback(result.error ?? 'Failed to delete supplier');
        return;
      }
      setSuppliers((prev) => prev.filter((supplier) => supplier.id !== id));
    });
  };

  const handleSync = (id: string) => {
    alert(`Syncing supplier ${id}...`);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Suppliers</h1>
        <Button onClick={openCreateForm} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="w-4 h-4 mr-2" />
          New Supplier
        </Button>
      </div>

      {feedback && (
        <div className="mb-6 rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {feedback}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Supplier Name</label>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                placeholder="e.g. Shanghai Auto Imports"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Import Type</label>
              <input
                value={importTypeInput}
                onChange={(e) => setImportTypeInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                placeholder="csv, rest, webhook..."
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">API Identifier</label>
              <input
                value={apiIdInput}
                onChange={(e) => setApiIdInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                placeholder="Supplier system ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contact Name</label>
              <input
                value={contactNameInput}
                onChange={(e) => setContactNameInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                placeholder="Operations manager"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Contact Email</label>
              <input
                type="email"
                value={contactEmailInput}
                onChange={(e) => setContactEmailInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                placeholder="ops@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">API Endpoint</label>
              <input
                value={endpointInput}
                onChange={(e) => setEndpointInput(e.target.value)}
                type="url"
                placeholder="https://supplier.example.com/webhook"
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {isPending ? 'Saving...' : formMode === 'edit' ? 'Update Supplier' : 'Add Supplier'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setFormMode('create');
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Import Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">API Identifier</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Contact</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Last Synced</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                  </tr>
                ))
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No suppliers configured.
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold">{supplier.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="bg-muted px-2 py-1 rounded text-xs font-medium">
                        {supplier.import_type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">
                      {supplier.api_identifier || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {supplier.contact_name && <div className="font-medium">{supplier.contact_name}</div>}
                      {supplier.contact_email && (
                        <a
                          href={`mailto:${supplier.contact_email}`}
                          className="text-xs text-muted-foreground hover:underline"
                        >
                          {supplier.contact_email}
                        </a>
                      )}
                      {!supplier.contact_name && !supplier.contact_email && <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {supplier.last_synced ? new Date(supplier.last_synced).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSync(supplier.id)}
                          className="hover:text-accent"
                          title="Sync supplier products"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:text-accent" asChild>
                          <Link href={`/admin/suppliers/${supplier.id}`}>Details</Link>
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:text-accent" onClick={() => openEditForm(supplier)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(supplier.id)}
                          disabled={isPending && editingId === supplier.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
