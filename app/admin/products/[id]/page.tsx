import Link from 'next/link';
import { ProductForm } from '@/components/admin/product-form';
import { Button } from '@/components/ui/button';

interface ProductEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductEditPage({ params }: ProductEditPageProps) {
  const { id } = await params;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Admin / Products</p>
          <h1 className="text-3xl font-bold">Edit Product</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/products">Back to list</Link>
        </Button>
      </div>
      <ProductForm productId={id} />
    </div>
  );
}
