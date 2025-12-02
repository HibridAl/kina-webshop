export interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
  country: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Model {
  id: string;
  brand_id: string;
  name: string;
  year_start: number | null;
  year_end: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  model_id: string;
  variant_name: string | null;
  engine_type: string | null;
  transmission: string | null;
  specifications: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

// Categories and Products
export interface Category {
  id: string;
  name: string;
  description: string | null;
  parent_category_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category_id: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  specifications: Record<string, any> | null;
  oem_numbers: string[] | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

// Suppliers and Mappings
export interface Supplier {
  id: string;
  name: string;
  api_endpoint: string | null;
  import_type: string | null;
  api_identifier: string | null;
  contact_name: string | null;
  contact_email: string | null;
  last_synced: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierImportRun {
  id: string;
  supplier_id: string;
  import_type: string | null;
  imported: number;
  failed: number;
  errors: string[] | null;
  created_at: string;
}

export interface ProductSupplierMapping {
  id: string;
  product_id: string;
  supplier_id: string;
  supplier_sku: string | null;
  supplier_price: number | null;
  supplier_stock: number | null;
  created_at: string;
  updated_at: string;
}

// Compatibility
export interface VehicleProductCompatibility {
  id: string;
  vehicle_id: string;
  product_id: string;
  compatible: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Users and Orders
export interface User {
  id: string;
  email: string | null;
  role: 'customer' | 'b2b' | 'admin';
  company_name: string | null;
  is_b2b: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  price_at_add?: number | null;
  name_snapshot?: string | null;
  products?: Pick<Product, 'name' | 'price' | 'image_url'> | null;
  created_at: string;
  updated_at: string;
}

export type OrderLifecycleStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'cancelled'
  | 'refunded'
  | 'confirmed' // legacy alias for 'paid'
  | 'delivered'; // legacy alias for 'shipped'

export interface Order {
  id: string;
  user_id: string | null;
  guest_email?: string | null;
  guest_name?: string | null;
  guest_phone?: string | null;
  total_amount: number;
  status: OrderLifecycleStatus;
  shipping_address: Record<string, any> | null;
  billing_address: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  products?: Pick<Product, 'name' | 'image_url' | 'price' | 'sku'> | null;
  created_at: string;
}

export interface OrderPayment {
  id: string;
  order_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  provider: string | null;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SearchSuggestionItem {
  text: string;
  type: 'term' | 'popular';
  source?: 'product' | 'category' | 'popular';
}

export interface SavedVehicle {
  id: string;
  user_id: string;
  vehicle_id: string;
  label: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  vehicles?: Vehicle | null;
}

export interface Address {
  id: string;
  user_id: string;
  type: 'personal' | 'business' | string;
  label: string | null;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  vat_id: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default_shipping: boolean;
  is_default_billing: boolean;
  created_at: string;
  updated_at: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  name: string | null;
  created_at: string;
  updated_at: string;
  items?: WishlistItem[];
}

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  product_id: string;
  created_at: string;
  products?: Product | null;
}

export interface SearchCategorySuggestion {
  id: string;
  name: string;
}

export interface SearchVehicleSuggestion {
  id: string;
  name: string;
  brand?: string | null;
}

export interface SearchProductSuggestion {
  id: string;
  name: string;
  sku?: string | null;
  price?: number | null;
  image_url?: string | null;
}

export interface SearchSuggestionsResponse {
  query: string;
  suggestions: SearchSuggestionItem[];
  categories: SearchCategorySuggestion[];
  vehicles: SearchVehicleSuggestion[];
  products: SearchProductSuggestion[];
}
