import Link from 'next/link';
import { ProductForm } from '@/components/admin/product-form';
import { Button } from '@/components/ui/button';

export default function NewProductPage() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Product</h1>
          <p className="text-sm text-muted-foreground">
            Add a new part to the catalog with pricing, inventory, and OEM details.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/products">Back to list</Link>
        </Button>
      </div>
      <ProductForm />
    </div>
  );
}
