'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocalizedText } from '@/components/ui/localized-text';
import { AddressCard, type Address } from '@/components/address-card';
import { AddressForm } from '@/components/address-form';
import { toast } from 'sonner';

// Mock data until backend T-19.3 is ready
const MOCK_ADDRESSES: Address[] = [
  {
    id: '1',
    name: 'John Doe',
    address_line1: '123 Main St',
    city: 'Budapest',
    zip: '1051',
    country: 'Hungary',
    phone: '+36 30 123 4567',
    is_default_shipping: true,
    is_default_billing: true,
  },
  {
    id: '2',
    name: 'AutoHub Office',
    company_name: 'AutoHub Kft.',
    address_line1: 'Business Park 4',
    address_line2: 'Building B, Floor 2',
    city: 'Debrecen',
    zip: '4000',
    country: 'Hungary',
    is_default_shipping: false,
    is_default_billing: false,
  },
];

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>(MOCK_ADDRESSES);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = () => {
    setEditingAddress(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success('Address deleted');
      setIsLoading(false);
    }, 500);
  };

  const handleSetDefault = async (id: string, type: 'shipping' | 'billing') => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          is_default_shipping: type === 'shipping' ? a.id === id : a.is_default_shipping,
          is_default_billing: type === 'billing' ? a.id === id : a.is_default_billing,
        }))
      );
      toast.success(`Default ${type} address updated`);
      setIsLoading(false);
    }, 500);
  };

  const handleFormSubmit = async (data: any) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (editingAddress) {
      setAddresses((prev) =>
        prev.map((a) => (a.id === editingAddress.id ? { ...a, ...data } : a))
      );
      toast.success('Address updated');
    } else {
      const newAddress = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
      };
      setAddresses((prev) => [...prev, newAddress]);
      toast.success('New address added');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          <LocalizedText hu="Címjegyzék" en="Address Book" />
        </h1>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          <LocalizedText hu="Új cím" en="Add Address" />
        </Button>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {addresses.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSetDefault={handleSetDefault}
          />
        ))}
      </div>

      {addresses.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">
            <LocalizedText hu="Még nincs mentett címe." en="No saved addresses yet." />
          </p>
          <Button variant="link" onClick={handleAdd} className="mt-2">
            <LocalizedText hu="Adjon hozzá egyet most" en="Add one now" />
          </Button>
        </div>
      )}

      {isFormOpen && (
        <AddressForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          initialData={editingAddress}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}
