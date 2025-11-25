export const migrationSteps = [
  {
    name: "Create Schema",
    file: "scripts/00-schema.sql",
    description: "Creates all 13 tables with RLS policies and indexes"
  },
  {
    name: "Seed Initial Data", 
    file: "scripts/01-seed-data.sql",
    description: "Populates brands, models, categories, and sample products"
  }
];

export function getMigrationInstructions() {
  return `
SUPABASE MIGRATION SETUP INSTRUCTIONS
=====================================

1. Open your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Go to SQL Editor (left sidebar)

FOR EACH MIGRATION:
4. Click "New Query" button (top right)
5. Open scripts/${migrationSteps[0].file}
6. Copy all the SQL content
7. Paste into the SQL editor
8. Click "Run" button
9. Wait for success message
10. Repeat for the next migration file

After both migrations complete:
- Your database will have 13 tables
- RLS policies will be configured
- Sample data will be populated
- Your e-commerce platform is ready to use!

TABLES CREATED:
- brands, models, vehicles
- categories, products
- suppliers, product_supplier_mapping
- vehicle_product_compatibility
- users, cart_items, orders, order_items, order_payments

All tables have proper indexes and RLS policies configured.
`;
}
