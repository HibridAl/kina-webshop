'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { Trash2, Edit, Plus } from 'lucide-react';
import { getCategories, getCategoryProductCount } from '@/lib/db';
import type { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { deleteCategoryAction, saveCategoryAction } from '@/app/admin/actions';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      setFeedback('Unable to load categories. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openCreateForm = () => {
    setFormMode('create');
    setEditingId(null);
    setNameInput('');
    setDescriptionInput('');
    setFeedback(null);
    setShowForm(true);
  };

  const openEditForm = (category: Category) => {
    setFormMode('edit');
    setEditingId(category.id);
    setNameInput(category.name);
    setDescriptionInput(category.description ?? '');
    setFeedback(null);
    setShowForm(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!nameInput.trim()) {
      setFeedback('Please provide a category name.');
      return;
    }

    startTransition(async () => {
      const result = await saveCategoryAction({
        id: editingId ?? undefined,
        name: nameInput.trim(),
        description: descriptionInput.trim() || null,
      });
      if (!result.success) {
        setFeedback(result.error ?? 'Failed to save category');
        return;
      }
      setFeedback(null);
      setShowForm(false);
      setNameInput('');
      setDescriptionInput('');
      setEditingId(null);
      loadCategories();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this category? Products assigned to it will be affected.')) return;
    setFeedback(null);
    setDeletingId(id);
    startTransition(async () => {
      const usage = await getCategoryProductCount(id);
      if (usage > 0) {
        setFeedback(`Cannot delete category while ${usage} product${usage === 1 ? '' : 's'} reference it. Reassign those products first.`);
        setDeletingId(null);
        return;
      }
      const result = await deleteCategoryAction(id);
      if (!result.success) {
        setFeedback(result.error ?? 'Failed to delete category');
        setDeletingId(null);
        return;
      }
      setCategories((prev) => prev.filter((category) => category.id !== id));
      setDeletingId(null);
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Categories</h1>
        <Button onClick={openCreateForm} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="w-4 h-4 mr-2" />
          New Category
        </Button>
      </div>

      {feedback && (
        <div className="mb-6 rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {feedback}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 bg-card border border-border rounded-lg p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-2">
              {formMode === 'edit' ? 'Update name' : 'Category Name'}
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter category name"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {isPending ? 'Saving...' : formMode === 'edit' ? 'Update Category' : 'Add Category'}
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
                <th className="px-6 py-3 text-left text-sm font-semibold">Description</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold">{category.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {category.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="hover:text-accent" onClick={() => openEditForm(category)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                          disabled={isPending && deletingId === category.id}
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
