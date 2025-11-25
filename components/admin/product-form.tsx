'use client';

import { useEffect, useState, useTransition } from 'react';
import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { saveProductAction, deleteProductAction } from '@/app/admin/actions';
import { getCategories, getProductById } from '@/lib/db';
import type { Category, Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductFormProps {
  productId?: string;
}

interface FormState {
  sku: string;
  name: string;
  category_id: string;
  price: string;
  stock_quantity: string;
  description: string;
  image_url: string;
}

const EMPTY_FORM: FormState = {
  sku: '',
  name: '',
  category_id: '',
  price: '',
  stock_quantity: '',
  description: '',
  image_url: '',
};

export function ProductForm({ productId }: ProductFormProps) {
  const [formState, setFormState] = useState<FormState>(EMPTY_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(!!productId);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [oemNumbers, setOemNumbers] = useState<string[]>(['']);
  const router = useRouter();

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories', err);
        setError('Unable to load categories. Please refresh.');
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    async function loadProduct(id: string) {
      try {
        const product = await getProductById(id);
        if (!product) {
          setError('Product not found');
          return;
        }
        hydrateForm(product);
      } catch (err) {
        console.error('Failed to load product', err);
        setError('Unable to load product. Please try again.');
      } finally {
        setLoadingProduct(false);
      }
    }

    function hydrateForm(product: Product) {
      setFormState({
        sku: product.sku || '',
        name: product.name || '',
        category_id: product.category_id || '',
        price: product.price?.toString() ?? '',
        stock_quantity: product.stock_quantity?.toString() ?? '',
        description: product.description || '',
        image_url: product.image_url || '',
      });
      if (Array.isArray(product.oem_numbers) && product.oem_numbers.length > 0) {
        setOemNumbers(product.oem_numbers.map((value) => value ?? '').filter((value) => typeof value === 'string'));
      } else {
        setOemNumbers(['']);
      }
    }

    if (productId) {
      loadProduct(productId);
    } else {
      setLoadingProduct(false);
      setOemNumbers(['']);
    }
  }, [productId]);

  const handleChange =
    (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const price = Number(formState.price);
    const stock = Number(formState.stock_quantity);

    if (Number.isNaN(price) || Number.isNaN(stock)) {
      setError('Price and stock must be valid numbers.');
      return;
    }
    if (!formState.category_id) {
      setError('Please select a category.');
      return;
    }

    const normalizedOem = oemNumbers
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    const payload = {
      id: productId,
      sku: formState.sku.trim(),
      name: formState.name.trim(),
      category_id: formState.category_id,
      description: formState.description.trim() || null,
      price,
      stock_quantity: stock,
      image_url: formState.image_url.trim(),
      oem_numbers: normalizedOem,
    };

    startTransition(async () => {
      const result = await saveProductAction(payload);
      if (!result.success) {
        setError(result.error ?? 'Failed to save product');
        return;
      }
      setSuccess('Product saved successfully.');
      router.push('/admin/products');
    });
  };

  const handleDelete = () => {
    if (!productId) return;
    if (!confirm('Delete this product? This cannot be undone.')) return;
    setError(null);

    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (!result.success) {
        setError(result.error ?? 'Failed to delete product');
        return;
      }
      router.push('/admin/products');
    });
  };

  if (loadingProduct || loadingCategories) {
    return <Skeleton className="h-[420px]" />;
  }

  const handleAddOem = () => {
    setOemNumbers((prev) => [...prev, '']);
  };

  const handleRemoveOem = (index: number) => {
    setOemNumbers((prev) => {
      if (prev.length === 1) return [''];
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleOemChange = (index: number, value: string) => {
    setOemNumbers((prev) => prev.map((entry, idx) => (idx === index ? value : entry)));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border rounded-lg p-6">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-900">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Product Name</label>
          <input
            name="name"
            value={formState.name}
            onChange={handleChange('name')}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">SKU</label>
          <input
            name="sku"
            value={formState.sku}
            onChange={handleChange('sku')}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <select
            name="category_id"
            value={formState.category_id}
            onChange={handleChange('category_id')}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Price (USD)</label>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={formState.price}
              onChange={handleChange('price')}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Stock Quantity</label>
            <input
              name="stock_quantity"
              type="number"
              min="0"
              step="1"
              value={formState.stock_quantity}
              onChange={handleChange('stock_quantity')}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          name="description"
          value={formState.description}
          onChange={handleChange('description')}
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Image URL</label>
          <input
            name="image_url"
            type="url"
            value={formState.image_url}
            onChange={handleChange('image_url')}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
          {formState.image_url && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-1">Preview</p>
              <div className="border border-border rounded-lg p-3 flex items-center justify-center bg-muted/40">
                <img src={formState.image_url} alt={formState.name || 'Product image'} className="max-h-32 object-contain" />
              </div>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">OEM Numbers</label>
          <p className="text-xs text-muted-foreground">
            Capture each OEM part number individually for cleaner search indexing.
          </p>
          <div className="space-y-2">
            {oemNumbers.map((value, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={value}
                  onChange={(event) => handleOemChange(index, event.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2"
                  placeholder="e.g. BM11-1502010"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveOem(index)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddOem} className="mt-1">
            <Plus className="w-4 h-4 mr-2" /> Add OEM number
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isPending} className="bg-accent text-accent-foreground">
          {isPending ? 'Saving...' : 'Save Product'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/products')}>
          Cancel
        </Button>
        {productId && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleDelete}
            disabled={isPending}
            className="text-destructive hover:text-destructive"
          >
            Delete Product
          </Button>
        )}
      </div>
    </form>
  );
}
