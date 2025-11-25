'use client';

export interface StoredOrderReceipt {
  id: string;
  total: number;
  items: Array<{ productId: string; quantity: number; price: number; name: string }>;
  shipping: Record<string, any>;
  billing: Record<string, any>;
}

const STORAGE_KEY = 'autohub-last-order';

export function storeOrderReceipt(payload: StoredOrderReceipt) {
  try {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Unable to persist receipt', error);
  }
}

export function getStoredOrderReceipt(orderId?: string): StoredOrderReceipt | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredOrderReceipt;
    if (orderId && parsed.id !== orderId) return null;
    return parsed;
  } catch (error) {
    console.warn('Unable to load receipt', error);
    return null;
  }
}

export function clearStoredOrderReceipt() {
  try {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to clear receipt', error);
  }
}
