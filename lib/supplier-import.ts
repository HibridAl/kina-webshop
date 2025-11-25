import type { Product, ProductSupplierMapping } from './types';

export interface SupplierImportData {
  sku: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
  oem_numbers?: string;
  description?: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
  timestamp: string;
}

export function parseCSVData(csvContent: string): SupplierImportData[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.toLowerCase().trim());
  const skuIndex = headers.indexOf('sku');
  const nameIndex = headers.indexOf('name');
  const priceIndex = headers.indexOf('price');
  const stockIndex = headers.indexOf('stock');
  const categoryIndex = headers.indexOf('category');
  const oemIndex = headers.indexOf('oem_numbers');
  const descIndex = headers.indexOf('description');

  if (skuIndex === -1 || nameIndex === -1) {
    throw new Error('CSV must contain SKU and Name columns');
  }

  const data: SupplierImportData[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    if (values.length < 2) continue;

    data.push({
      sku: values[skuIndex],
      name: values[nameIndex],
      price: priceIndex !== -1 ? parseFloat(values[priceIndex]) : 0,
      stock: stockIndex !== -1 ? parseInt(values[stockIndex]) : 0,
      category: categoryIndex !== -1 ? values[categoryIndex] : undefined,
      oem_numbers: oemIndex !== -1 ? values[oemIndex] : undefined,
      description: descIndex !== -1 ? values[descIndex] : undefined,
    });
  }

  return data;
}

export function parseJSONData(jsonContent: string | object): SupplierImportData[] {
  const data = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;

  if (!Array.isArray(data)) {
    throw new Error('JSON must be an array of products');
  }

  return data.map((item: any) => ({
    sku: item.sku || item.id,
    name: item.name || item.product_name,
    price: parseFloat(item.price || item.cost || 0),
    stock: parseInt(item.stock || item.quantity || 0),
    category: item.category,
    oem_numbers: Array.isArray(item.oem_numbers)
      ? item.oem_numbers.join(', ')
      : item.oem_numbers,
    description: item.description || item.details,
  }));
}

export function validateImportData(data: SupplierImportData[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    if (!item.sku || item.sku.trim() === '') {
      errors.push(`Row ${i + 1}: SKU is required`);
    }

    if (!item.name || item.name.trim() === '') {
      errors.push(`Row ${i + 1}: Name is required`);
    }

    if (isNaN(item.price) || item.price < 0) {
      errors.push(`Row ${i + 1}: Invalid price`);
    }

    if (isNaN(item.stock) || item.stock < 0) {
      errors.push(`Row ${i + 1}: Invalid stock quantity`);
    }
  }

  return { valid: errors.length === 0, errors };
}
