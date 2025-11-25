-- Seed Brands
INSERT INTO brands (name, country, description, logo_url) VALUES
('MG', 'China', 'Morris Garages - British brand now owned by SAIC', '/images/brands/mg.png'),
('BYD', 'China', 'Build Your Dreams - Leading EV manufacturer', '/images/brands/byd.png'),
('Omoda', 'China', 'Chery''s premium brand', '/images/brands/omoda.png'),
('Geely', 'China', 'Geely Automobile Holdings', '/images/brands/geely.png'),
('Haval', 'China', 'Great Wall Motors premium SUV brand', '/images/brands/haval.png')
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
FROM models WHERE name = 'MG4' AND (SELECT id FROM brands WHERE name = 'MG') IS NOT NULL;

INSERT INTO vehicles (model_id, variant_name, engine_type, transmission, specifications)
SELECT id, 'Extended Range', 'Electric', 'Single Speed', '{"battery": "61kWh", "range": "520km", "power": "150kW"}'::jsonb 
FROM models WHERE name = 'MG4' AND (SELECT id FROM brands WHERE name = 'MG') IS NOT NULL;

-- Seed Products
INSERT INTO products (sku, name, category_id, description, price, stock_quantity, oem_numbers, image_url)
SELECT 'MG4-OIL-001', 'Synthetic Engine Oil 5W-30 (5L)', id, 'Premium synthetic oil for MG4', 45.99, 100, '["MG4-OIL-001"]'::jsonb, '/images/products/engine-oil.jpg'
FROM categories WHERE name = 'Maintenance & Fluids' LIMIT 1;

INSERT INTO products (sku, name, category_id, description, price, stock_quantity, oem_numbers, image_url)
SELECT 'MG4-AIR-001', 'Engine Air Filter', id, 'Original MG4 air filter', 24.50, 150, '["MG4-AIR-001", "A2004700"]'::jsonb, '/images/products/air-filter.jpg'
FROM categories WHERE name = 'Air & Fuel' LIMIT 1;

INSERT INTO products (sku, name, category_id, description, price, stock_quantity, oem_numbers, image_url)
SELECT 'MG4-BRAKE-001', 'Front Brake Pads Set', id, 'Ceramic brake pads for smooth braking', 65.00, 80, '["MG4-BRAKE-001"]'::jsonb, '/images/products/brake-pads.jpg'
FROM categories WHERE name = 'Brakes' LIMIT 1;

INSERT INTO products (sku, name, category_id, description, price, stock_quantity, oem_numbers, image_url)
SELECT 'MG-SEAT-001', 'Black Leather Seat Covers (Set)', id, 'Premium leather seat covers', 189.99, 50, '["MG-SEAT-001"]'::jsonb, '/images/products/seat-covers.jpg'
FROM categories WHERE name = 'Interior Accessories' LIMIT 1;

INSERT INTO products (sku, name, category_id, description, price, stock_quantity, oem_numbers, image_url)
SELECT 'MG-BATTERY-001', 'Car Battery 60Ah', id, 'Reliable power supply for all MG models', 145.00, 60, '["MG-BATTERY-001"]'::jsonb, '/images/products/battery.jpg'
FROM categories WHERE name = 'Electrical' LIMIT 1;

INSERT INTO products (sku, name, category_id, description, price, stock_quantity, oem_numbers, image_url)
SELECT 'MG4-LED-001', 'LED Headlight Upgrade Kit', id, 'Modern LED headlights with better visibility', 299.99, 30, '["MG4-LED-001"]'::jsonb, '/images/products/led-headlights.jpg'
FROM categories WHERE name = 'Lighting' LIMIT 1;

-- Seed Suppliers
INSERT INTO suppliers (name, api_endpoint, import_type) VALUES
('AutoParts Direct', 'https://api.autoparts-direct.com/products', 'rest'),
('EV Parts Global', 'https://api.evparts-global.com/products', 'rest'),
('OEM Parts Hub', 'https://api.oemparts-hub.com/products', 'rest')
ON CONFLICT (name) DO NOTHING;
