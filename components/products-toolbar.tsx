'use client';

import { Trash2, Download, DollarSign, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocalizedText } from '@/components/ui/localized-text';

interface ProductsToolbarProps {
  selectedCount: number;
  onDelete: () => void;
  onExport: () => void;
  onUpdatePrice: () => void;
  onUpdateStatus: () => void;
}

export function ProductsToolbar({
  selectedCount,
  onDelete,
  onExport,
  onUpdatePrice,
  onUpdateStatus,
}: ProductsToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-border bg-popover px-4 py-2 shadow-xl animate-in slide-in-from-bottom-10">
      <div className="mr-2 flex items-center gap-2 border-r border-border pr-4 text-sm font-medium">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
          {selectedCount}
        </span>
        <span className="hidden sm:inline">Selected</span>
      </div>
      
      <Button variant="ghost" size="sm" onClick={onUpdatePrice} className="h-8">
        <DollarSign className="mr-2 h-3.5 w-3.5" />
        Price
      </Button>
      
      <Button variant="ghost" size="sm" onClick={onUpdateStatus} className="h-8">
        <Archive className="mr-2 h-3.5 w-3.5" />
        Status
      </Button>

      <Button variant="ghost" size="sm" onClick={onExport} className="h-8">
        <Download className="mr-2 h-3.5 w-3.5" />
        Export
      </Button>

      <div className="mx-1 h-4 w-px bg-border" />

      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="mr-2 h-3.5 w-3.5" />
        Delete
      </Button>
    </div>
  );
}