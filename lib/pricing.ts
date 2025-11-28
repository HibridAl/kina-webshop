export interface ShippingMethod {
  id: string;
  code?: string | null;
  name: string;
  description?: string | null;
  deliveryEstimate?: string | null;
  price: number;
  currency?: string | null;
  isExpress?: boolean;
  isDefault?: boolean;
  region?: string | null;
  active?: boolean;
}

export interface OrderTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  taxRate: number;
  taxLabel: string;
}

export interface TaxConfig {
  label: string;
  rate: number;
  countries?: string[];
  aliases?: string[];
}

export const FALLBACK_SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'standard',
    code: 'standard',
    name: 'Standard Shipping',
    description: 'Ground shipping with full parcel tracking',
    deliveryEstimate: '5-7 business days',
    price: 10,
    isDefault: true,
  },
  {
    id: 'express',
    code: 'express',
    name: 'Express Shipping',
    description: 'Expedited courier service with insurance',
    deliveryEstimate: '2-3 business days',
    price: 25,
    isExpress: true,
  },
];

const TAX_ZONES: TaxConfig[] = [
  {
    label: 'Hungary VAT (27%)',
    rate: 0.27,
    countries: ['HU'],
    aliases: ['HUNGARY'],
  },
  {
    label: 'EU VAT (20%)',
    rate: 0.2,
    countries: [
      'AT',
      'BE',
      'BG',
      'CY',
      'CZ',
      'DE',
      'DK',
      'EE',
      'ES',
      'FI',
      'FR',
      'GR',
      'HR',
      'IE',
      'IT',
      'LT',
      'LU',
      'LV',
      'MT',
      'NL',
      'PL',
      'PT',
      'RO',
      'SE',
      'SI',
      'SK',
    ],
    aliases: ['EU', 'EUROPEAN UNION'],
  },
  {
    label: 'United Kingdom VAT (20%)',
    rate: 0.2,
    countries: ['GB', 'UK'],
    aliases: ['UNITED KINGDOM'],
  },
  {
    label: 'United States Sales Tax (8%)',
    rate: 0.08,
    countries: ['US', 'USA'],
    aliases: ['UNITED STATES', 'UNITED STATES OF AMERICA'],
  },
];

const DEFAULT_TAX_CONFIG: TaxConfig = {
  label: 'Tax (10%)',
  rate: 0.1,
};

const COUNTRY_ALIASES: Record<string, string> = {
  hungary: 'HU',
  deutschland: 'DE',
  germany: 'DE',
  france: 'FR',
  espana: 'ES',
  spain: 'ES',
  italy: 'IT',
  austria: 'AT',
  poland: 'PL',
  romania: 'RO',
  croatia: 'HR',
  slovakia: 'SK',
  slovenia: 'SI',
  'czech republic': 'CZ',
  ireland: 'IE',
  portugal: 'PT',
  belgium: 'BE',
  netherlands: 'NL',
  'united kingdom': 'GB',
  britain: 'GB',
  uk: 'GB',
  england: 'GB',
  scotland: 'GB',
  'united states': 'US',
  usa: 'US',
  america: 'US',
  canada: 'CA',
};

function normalizeCountryCode(country?: string | null): string | null {
  if (!country) return null;
  const trimmed = country.trim();
  if (!trimmed) return null;

  const alias = COUNTRY_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;

  if (trimmed.length <= 3) {
    return trimmed.toUpperCase();
  }

  return trimmed.slice(0, 2).toUpperCase();
}

export function getTaxConfig(country?: string | null): TaxConfig {
  const normalized = normalizeCountryCode(country);
  if (!normalized) return DEFAULT_TAX_CONFIG;

  const match = TAX_ZONES.find((zone) => {
    const countryList = zone.countries ?? [];
    if (countryList.includes(normalized)) return true;
    if (zone.aliases) {
      return zone.aliases.some((alias) => alias.toUpperCase() === normalized);
    }
    return false;
  });

  return match ?? DEFAULT_TAX_CONFIG;
}

export function calculateTax(subtotal: number, country?: string | null) {
  const config = getTaxConfig(country);
  const amount = Math.max(0, subtotal) * config.rate;
  return {
    amount,
    rate: config.rate,
    label: config.label,
  };
}

export function calculateOrderTotals(
  subtotal: number,
  shippingMethod?: ShippingMethod | null,
  options?: { country?: string | null }
): OrderTotals {
  const shipping = shippingMethod?.price ?? 0;
  const taxResult = calculateTax(subtotal, options?.country);
  const total = subtotal + shipping + taxResult.amount;

  return {
    subtotal,
    shipping,
    tax: taxResult.amount,
    total,
    taxRate: taxResult.rate,
    taxLabel: taxResult.label,
  };
}

export function getDefaultShippingMethod(methods?: ShippingMethod[]): ShippingMethod {
  const source = methods?.length ? methods : FALLBACK_SHIPPING_METHODS;
  return (
    source.find((method) => method.isDefault) ??
    source[0] ??
    FALLBACK_SHIPPING_METHODS[0]
  );
}

export function findShippingMethod(methods: ShippingMethod[], methodId?: string) {
  if (!methods?.length) {
    return getDefaultShippingMethod(FALLBACK_SHIPPING_METHODS);
  }
  if (!methodId) {
    return getDefaultShippingMethod(methods);
  }
  return methods.find((method) => method.id === methodId) ?? getDefaultShippingMethod(methods);
}
