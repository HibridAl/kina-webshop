'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { LocalizedText } from '@/components/ui/localized-text';

const addressSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  company_name: z.string().optional(),
  address_line1: z.string().min(5, 'Address is required'),
  address_line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().optional(),
  zip: z.string().min(3, 'ZIP code is required'),
  country: z.string().min(2, 'Country is required'),
  phone: z.string().optional(),
  is_default_shipping: z.boolean().default(false),
  is_default_billing: z.boolean().default(false),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: AddressFormValues;
  onSubmit: (data: AddressFormValues) => Promise<void>;
}

export function AddressForm({ open, onOpenChange, initialData, onSubmit }: AddressFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: initialData || {
      name: '',
      company_name: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      phone: '',
      is_default_shipping: false,
      is_default_billing: false,
    },
  });

  const handleSubmit = async (data: AddressFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? (
              <LocalizedText hu="Cím szerkesztése" en="Edit Address" />
            ) : (
              <LocalizedText hu="Új cím hozzáadása" en="Add New Address" />
            )}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><LocalizedText hu="Név" en="Name" /></FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><LocalizedText hu="Telefonszám" en="Phone" /></FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel><LocalizedText hu="Cégnév (opcionális)" en="Company (optional)" /></FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address_line1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel><LocalizedText hu="Cím" en="Address" /></FormLabel>
                  <FormControl><Input {...field} placeholder="Street, number" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address_line2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel><LocalizedText hu="További címadatok" en="Apartment, suite, etc." /></FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><LocalizedText hu="Város" en="City" /></FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><LocalizedText hu="Irányítószám" en="ZIP Code" /></FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><LocalizedText hu="Megye / Állam" en="State / Province" /></FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel><LocalizedText hu="Ország" en="Country" /></FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                <LocalizedText hu="Mégse" en="Cancel" />
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <LocalizedText hu="Mentés" en="Save" />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
