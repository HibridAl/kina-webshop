'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Copy } from 'lucide-react';

export default function SetupPage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const schemaSQL = `-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  logo_url TEXT,
  country VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create models table
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  year_start INTEGER,
  year_end INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(brand_id, name)
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  variant_name VARCHAR(255),
  engine_type VARCHAR(100),
  transmission VARCHAR(100),
  specifications JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  api_endpoint TEXT,
  import_type VARCHAR(50),
  last_synced TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Track supplier import runs
CREATE TABLE IF NOT EXISTS supplier_import_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  import_type VARCHAR(50),
  imported INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  errors JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  price NUMERIC(12, 2),
  stock_quantity INTEGER DEFAULT 0,
  specifications JSONB,
  oem_numbers JSONB,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create product_supplier_mapping table
CREATE TABLE IF NOT EXISTS product_supplier_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  supplier_sku VARCHAR(100),
  supplier_price NUMERIC(12, 2),
  supplier_stock INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, supplier_id)
);

-- Create vehicle_product_compatibility table
CREATE TABLE IF NOT EXISTS vehicle_product_compatibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  compatible BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(vehicle_id, product_id)
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE,
  role VARCHAR(50) DEFAULT 'customer',
  company_name VARCHAR(255),
  is_b2b BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_amount NUMERIC(12, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  shipping_address JSONB,
  billing_address JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price_at_purchase NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create order_payments table
CREATE TABLE IF NOT EXISTS order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  provider VARCHAR(50),
  transaction_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_import_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_supplier_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_product_compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Brands are readable by all" ON brands FOR SELECT USING (true);
CREATE POLICY "Models are readable by all" ON models FOR SELECT USING (true);
CREATE POLICY "Vehicles are readable by all" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Categories are readable by all" ON categories FOR SELECT USING (true);
CREATE POLICY "Products are readable by all" ON products FOR SELECT USING (true);
CREATE POLICY "Product supplier mapping readable by all" ON product_supplier_mapping FOR SELECT USING (true);
CREATE POLICY "Vehicle compatibility readable by all" ON vehicle_product_compatibility FOR SELECT USING (true);
CREATE POLICY "Supplier import runs readable by all" ON supplier_import_runs FOR SELECT USING (true);

CREATE POLICY "Users can read own cart" ON cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cart" ON cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cart" ON cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cart" ON cart_items FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own order items" ON order_items FOR SELECT USING (
  order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);

CREATE POLICY "Suppliers readable by all" ON suppliers FOR SELECT USING (true);

-- Create indexes
CREATE INDEX idx_models_brand_id ON models(brand_id);
CREATE INDEX idx_vehicles_model_id ON vehicles(model_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_product_supplier_mapping_product_id ON product_supplier_mapping(product_id);
CREATE INDEX idx_product_supplier_mapping_supplier_id ON product_supplier_mapping(supplier_id);
CREATE INDEX idx_vehicle_compatibility_vehicle_id ON vehicle_product_compatibility(vehicle_id);
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_payments_order_id ON order_payments(order_id);`;

  const seedSQL = `-- Seed Brands
INSERT INTO brands (name, country, description, logo_url) VALUES
('MG', 'China', 'Morris Garages - British brand now owned by SAIC', '/placeholder.svg?height=100&width=100'),
('BYD', 'China', 'Build Your Dreams - Leading EV manufacturer', '/placeholder.svg?height=100&width=100'),
('Omoda', 'China', 'Chery''s premium brand', '/placeholder.svg?height=100&width=100'),
('Geely', 'China', 'Geely Automobile Holdings', '/placeholder.svg?height=100&width=100'),
('Haval', 'China', 'Great Wall Motors premium SUV brand', '/placeholder.svg?height=100&width=100')
ON CONFLICT (name) DO NOTHING;

-- Seed Categories
INSERT INTO categories (name, description) VALUES
('Engine & Cooling', 'Engine parts, filters, cooling systems'),
('Brakes', 'Brake pads, rotors, brake fluid'),
('Suspension & Steering', 'Shocks, springs, tie rods, steering components'),
('Electrical', 'Battery, alternator, starter, wiring'),
('Interior Accessories', 'Seat covers, floor mats, organizers'),
('Exterior Accessories', 'Body kits, spoilers, mirrors, lights'),
('Transmission & Drivetrain', 'Transmission fluid, oil, differentials'),
('Lighting', 'Headlights, taillights, LED upgrades'),
('Air & Fuel', 'Air filters, fuel filters, intake systems'),
('Maintenance & Fluids', 'Oil, coolant, brake fluid, transmission fluid')
ON CONFLICT (name) DO NOTHING;

-- Seed Models for MG
INSERT INTO models (brand_id, name, year_start, year_end, description) 
SELECT id, 'MG4', 2021, 2025, 'Compact EV hatchback' FROM brands WHERE name = 'MG'
ON CONFLICT (brand_id, name) DO NOTHING;

INSERT INTO models (brand_id, name, year_start, year_end, description) 
SELECT id, 'MG ZS EV', 2020, 2025, 'Compact electric SUV' FROM brands WHERE name = 'MG'
ON CONFLICT (brand_id, name) DO NOTHING;

INSERT INTO models (brand_id, name, year_start, year_end, description) 
SELECT id, 'MG5', 2020, 2025, 'Affordable sedan' FROM brands WHERE name = 'MG'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Seed Models for BYD
INSERT INTO models (brand_id, name, year_start, year_end, description) 
SELECT id, 'Atto 3', 2021, 2025, 'Compact EV SUV' FROM brands WHERE name = 'BYD'
ON CONFLICT (brand_id, name) DO NOTHING;

INSERT INTO models (brand_id, name, year_start, year_end, description) 
SELECT id, 'Qin DM-i', 2020, 2025, 'Plug-in hybrid sedan' FROM brands WHERE name = 'BYD'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Seed Vehicles for MG4
INSERT INTO vehicles (model_id, variant_name, engine_type, transmission, specifications)
SELECT id, 'Standard Range', 'Electric', 'Single Speed', '{"battery": "44kWh", "range": "350km", "power": "150kW"}'::jsonb 
FROM models WHERE name = 'MG4';

INSERT INTO vehicles (model_id, variant_name, engine_type, transmission, specifications)
SELECT id, 'Extended Range', 'Electric', 'Single Speed', '{"battery": "61kWh", "range": "520km", "power": "150kW"}'::jsonb 
FROM models WHERE name = 'MG4';

-- Seed Products
INSERT INTO products (sku, name, category_id, description, price, stock_quantity, oem_numbers, image_url)
SELECT 'MG4-OIL-001', 'Synthetic Engine Oil 5W-30 (5L)', id, 'Premium synthetic oil for MG4', 45.99, 100, '["MG4-OIL-001"]'::jsonb, '/placeholder.svg?height=300&width=300'
FROM categories WHERE name = 'Maintenance & Fluids' LIMIT 1;

INSERT INTO products (sku, name, category_id, description, price, stock_quantity, oem_numbers, image_url)
SELECT 'MG4-AIR-001', 'Engine Air Filter', id, 'Original MG4 air filter', 24.50, 150, '["MG4-AIR-001", "A2004700"]'::jsonb, '/placeholder.svg?height=300&width=300'
FROM categories WHERE name = 'Air & Fuel' LIMIT 1;

INSERT INTO products (sku, name, category_id, description, price, stock_quantity, oem_numbers, image_url)
SELECT 'MG4-BRAKE-001', 'Front Brake Pads Set', id, 'Ceramic brake pads for smooth braking', 65.00, 80, '["MG4-BRAKE-001"]'::jsonb, '/placeholder.svg?height=300&width=300'
FROM categories WHERE name = 'Brakes' LIMIT 1;

INSERT INTO products (sku, name, category_id, description, price, stock_quantity, oem_numbers, image_url)
SELECT 'MG-SEAT-001', 'Black Leather Seat Covers (Set)', id, 'Premium leather seat covers', 189.99, 50, '["MG-SEAT-001"]'::jsonb, '/placeholder.svg?height=300&width=300'
FROM categories WHERE name = 'Interior Accessories' LIMIT 1;

INSERT INTO products (sku, name, category_id, description, price, stock_quantity, oem_numbers, image_url)
SELECT 'MG-BATTERY-001', 'Car Battery 60Ah', id, 'Reliable power supply for all MG models', 145.00, 60, '["MG-BATTERY-001"]'::jsonb, '/placeholder.svg?height=300&width=300'
FROM categories WHERE name = 'Electrical' LIMIT 1;

INSERT INTO products (sku, name, category_id, description, price, stock_quantity, oem_numbers, image_url)
SELECT 'MG4-LED-001', 'LED Headlight Upgrade Kit', id, 'Modern LED headlights with better visibility', 299.99, 30, '["MG4-LED-001"]'::jsonb, '/placeholder.svg?height=300&width=300'
FROM categories WHERE name = 'Lighting' LIMIT 1;

-- Seed Suppliers
INSERT INTO suppliers (name, api_endpoint, import_type) VALUES
('AutoParts Direct', 'https://api.autoparts-direct.com/products', 'rest'),
('EV Parts Global', 'https://api.evparts-global.com/products', 'rest'),
('OEM Parts Hub', 'https://api.oemparts-hub.com/products', 'rest')
ON CONFLICT (name) DO NOTHING;`;

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Database Setup</h1>
          <p className="text-slate-600">Initialize your e-commerce platform database</p>
        </div>

        <div className="space-y-6">
          {/* Step 1: Schema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold">
                  1
                </span>
                Create Database Schema
              </CardTitle>
              <CardDescription>
                Create all 13 tables with proper relationships and indexes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
                <code className="text-slate-700">{schemaSQL}</code>
              </div>
              <Button
                onClick={() => copyToClipboard(schemaSQL, 'schema')}
                className="w-full"
                variant="outline"
              >
                {copiedSection === 'schema' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Schema SQL
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Step 2: Seed Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold">
                  2
                </span>
                Seed Initial Data
              </CardTitle>
              <CardDescription>
                Populate brands, categories, models, vehicles, and products
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
                <code className="text-slate-700">{seedSQL}</code>
              </div>
              <Button
                onClick={() => copyToClipboard(seedSQL, 'seed')}
                className="w-full"
                variant="outline"
              >
                {copiedSection === 'seed' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Seed SQL
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <AlertCircle className="w-5 h-5" />
                How to Run the Migrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-amber-900">
              <ol className="list-decimal list-inside space-y-2">
                <li>Go to your <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="font-semibold underline">Supabase Dashboard</a></li>
                <li>Select your project</li>
                <li>Click <strong>SQL Editor</strong> in the left sidebar</li>
                <li>Click <strong>New Query</strong></li>
                <li>Click the <strong>Copy Schema SQL</strong> button above</li>
                <li>Paste into the SQL editor and click <strong>Run</strong></li>
                <li>Repeat steps 4-6 with the <strong>Copy Seed SQL</strong> button</li>
                <li>Your database is now ready!</li>
              </ol>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                What's Included
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold text-slate-900">Tables</h4>
                <p className="text-sm text-slate-600">brands, models, vehicles, categories, products, suppliers, cart_items, orders, order_items, order_payments, users, product_supplier_mapping, vehicle_product_compatibility</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Sample Data</h4>
                <p className="text-sm text-slate-600">5 Chinese car brands (MG, BYD, Omoda, Geely, Haval), 10 product categories, 5 models with vehicles, 6 sample products, 3 suppliers</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Security</h4>
                <p className="text-sm text-slate-600">Row Level Security (RLS) policies configured for public data access and user-specific cart/orders</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
