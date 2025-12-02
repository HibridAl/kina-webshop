import { Address } from "@/components/address-card";

// Mock addresses for checkout until backend is ready
export const CHECKOUT_MOCK_ADDRESSES: Address[] = [
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
];
