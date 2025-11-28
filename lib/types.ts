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

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
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
