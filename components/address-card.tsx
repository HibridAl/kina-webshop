'use client';

import { MapPin, MoreVertical, Phone, Building2, Star, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LocalizedText } from '@/components/ui/localized-text';
import { Badge } from '@/components/ui/badge';

export interface Address {
  id: string;
  name: string;
  company_name?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
  phone?: string;
  is_default_shipping: boolean;
  is_default_billing: boolean;
}

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string, type: 'shipping' | 'billing') => void;
}

export function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  return (
    <Card className="relative flex flex-col">
      <CardHeader className="pb-3 pt-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold flex items-center gap-2">
              {address.name}
              {address.is_default_shipping && (
                <Badge variant="secondary" className="text-[10px]">
                  <LocalizedText hu="Alapértelmezett (Száll.)" en="Default Ship" />
                </Badge>
              )}
              {address.is_default_billing && (
                <Badge variant="outline" className="text-[10px]">
                  <LocalizedText hu="Alapértelmezett (Számla)" en="Default Bill" />
                </Badge>
              )}
            </h3>
            {address.company_name && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Building2 className="mr-1 h-3 w-3" />
                {address.company_name}
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(address)}>
                <Edit2 className="mr-2 h-4 w-4" />
                <LocalizedText hu="Szerkesztés" en="Edit" />
              </DropdownMenuItem>
              {!address.is_default_shipping && (
                <DropdownMenuItem onClick={() => onSetDefault(address.id, 'shipping')}>
                  <Star className="mr-2 h-4 w-4" />
                  <LocalizedText hu="Beállítás szállítási címként" en="Set as default shipping" />
                </DropdownMenuItem>
              )}
              {!address.is_default_billing && (
                <DropdownMenuItem onClick={() => onSetDefault(address.id, 'billing')}>
                  <Star className="mr-2 h-4 w-4" />
                  <LocalizedText hu="Beállítás számlázási címként" en="Set as default billing" />
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(address.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <LocalizedText hu="Törlés" en="Delete" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-1 text-sm">
        <div className="flex items-start gap-2 text-muted-foreground mb-2">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p>{address.address_line1}</p>
            {address.address_line2 && <p>{address.address_line2}</p>}
            <p>
              {address.city}, {address.state ? `${address.state} ` : ''}
              {address.zip}
            </p>
            <p>{address.country}</p>
          </div>
        </div>
        {address.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{address.phone}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
