'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

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
      params.delete('search'); // prefer OEM search over generic search
    } else {
      params.delete('oem');
    }

    router.push(`/products?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${className ?? ''}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by OEM or SKU"
        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <Button type="submit" size="sm">
        OEM Search
      </Button>
    </form>
  );
}
