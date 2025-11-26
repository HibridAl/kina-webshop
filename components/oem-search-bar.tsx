'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface OemSearchBarProps {
  className?: string;
}

export function OemSearchBar({ className }: OemSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState('');

  useEffect(() => {
    const existing = searchParams.get('oem') || '';
    setValue(existing);
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    const params = new URLSearchParams(searchParams.toString());

    if (trimmed) {
      params.set('oem', trimmed);
      params.delete('search');
    } else {
      params.delete('oem');
    }

    router.push(`/products?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-2 ${className ?? ''}`}>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by OEM or SKU"
        leadingIcon={<Search className="h-4 w-4" />}
        trailingAction={
          <Button type="submit" size="sm" className="rounded-full">
            Lookup
          </Button>
        }
      />
    </form>
  );
}
