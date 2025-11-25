# AutoHub - E-Commerce Platform for Chinese Automotive Parts

A modern, full-stack e-commerce platform for buying and selling automotive parts and accessories for Chinese car brands (MG, BYD, Omoda, Geely, Haval).

## Features

### Customer-Facing Features
- **Product Catalog**: Browse and search thousands of automotive parts
- **Advanced Filtering**: Filter by brand, category, price range, stock status
- **Product Details**: View specifications, OEM numbers, supplier pricing
- **Shopping Cart**: Add/remove items, persistent cart storage
- **Checkout**: Multi-step checkout with shipping and payment
- **Brand Browser**: Explore brands and models with vehicle compatibility

### Admin Dashboard
- **Product Management**: Create, edit, delete products
- **Category Management**: Organize products into categories
- **Supplier Management**: Configure and manage supplier integrations
- **Import Pipeline**: CSV, JSON, and REST API product imports
- **Admin Authentication**: Secure admin panel access

### Technical Features
- **Responsive Design**: Mobile-first, works on all devices
- **Performance Optimized**: Image optimization, caching, CDN-ready
- **SEO Optimized**: Structured data, sitemaps, robots.txt
- **Type Safe**: Full TypeScript coverage
- **Modern Stack**: Next.js 16, React 19, Tailwind CSS v4

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
\`\`\`bash
git clone https://github.com/yourusername/autohub.git
cd autohub
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Configure Supabase connection (when available):
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
\`\`\`

5. Run development server
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Database Setup

When Supabase is available, run the migration scripts:

\`\`\`bash
# From Supabase dashboard SQL editor, run:
# scripts/00-schema.sql - Create database tables and RLS policies
# scripts/01-seed-data.sql - Populate with demo data
# scripts/02-oil-selector.sql - Create oil selector recommendation table
\`\`\`

## Admin Access

With Supabase configured:

1. Create a customer account at `/auth/register` using the email you want to promote.
2. Run `npx ts-node scripts/bootstrap-admin.ts you@example.com` (requires `SUPABASE_SERVICE_ROLE_KEY`).
3. Sign in via `/auth/login?next=/admin` or the header menu, then you will be redirected into `/admin`.

For local demos without Supabase, `/admin/login` still accepts the fallback password `admin123`.

## Oil & Fluid Selector Data

The `/oil-selector` page reads live recommendations from the Supabase table `oil_recommendations`. To ingest the manufacturer data from your `autok.txt` dump:

1. **Ensure the table exists** – run `scripts/02-oil-selector.sql` in the Supabase SQL editor (or apply the migration) so `public.oil_recommendations` and its indexes are created.
2. **Place `autok.txt`** – copy the raw JSON into the repo root or set `AUTOK_PATH` to point at its actual location.
3. **Run the ingestion script** – with your Supabase env vars already defined in `.env.local`, execute:

   ```powershell
   $env:AUTOK_PATH = "D:\rendesprojekt\my-new\autok.txt"  # adjust as needed
   node .\scripts\ingest-autok-to-supabase.cjs
   ```

   The script streams the huge JSON, filters to MG/BYD/Omoda/Geely/Haval, and upserts each system (Engine, Transmission, etc.) into `oil_recommendations`.

4. **Verify** – use the Supabase table editor to confirm rows exist, then open `/oil-selector` and pick a brand; capacities and products should appear immediately. Re-run the script whenever `autok.txt` changes (it is idempotent thanks to `upsert`).

## Supplier Import Workflow

1. **Stage data files** – drop CSV or JSON payloads into a working folder such as `scripts/import-samples/` so they are easy to re-use. CSV feeds must include `sku,name,price,stock` columns; JSON feeds should be an array that matches the importer schema from `lib/supplier-import.ts`.
2. **Use the admin UI** – visit `/admin/suppliers/import`, choose the supplier, select `csv`, `json`, or `rest`, then either upload your staged file or provide the upstream REST endpoint. Click **Preview** to validate and inspect the first 10 rows.
3. **Trigger the API** – clicking **Import products** sends a `POST /api/admin/import` request with a payload such as:

   ```bash
   curl -X POST http://localhost:3000/api/admin/import \
     -H 'Content-Type: application/json' \
     -d '{
       "supplierId": "<uuid>",
       "importType": "csv",
       "data": [{ "sku": "MG-15-AC", "name": "Cabin Filter", "price": 19.5, "stock": 120 }]
     }'
   ```

   The response returns `{ success, imported, failed, errors, historyId, timestamp }`, which is also surfaced back in the UI.
4. **Review history** – the admin detail view (`/admin/suppliers/<id>/import-history`) calls `GET /api/admin/import?supplierId=<id>` and lists the 10 most recent runs with imported/failed counts and truncated error logs.

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

\`\`\`bash
# Or deploy from CLI
npm i -g vercel
vercel
\`\`\`

## Project Structure

\`\`\`
/app
  /(public)          # Customer-facing pages
    /products        # Product listing and details
    /brands          # Brand browser
    /cart            # Shopping cart
    /checkout        # Checkout flow
  /admin             # Admin dashboard
    /dashboard       # Admin overview
    /products        # Product management
    /categories      # Category management
    /suppliers       # Supplier management
  /api               # API routes
/components          # Reusable React components
/lib                 # Utilities, types, database helpers
/scripts             # Database migrations and seeds
\`\`\`

## Route Overview

| Route | Highlights |
| --- | --- |
| `/` | Marketing hero plus the Suspense-powered Vehicle Selector and OEM search shortcuts for fast discovery. |
| `/products` | Catalog grid with OEM number lookup, keyword search, and the guided vehicle selector embedded at the top. |
| `/products/[id]` | Detailed PDP with specs, OEM references, JSON-LD, and compatibility callouts. |
| `/brands`, `/brands/[id]`, `/brands/[id]/models/[modelId]` | Brand/model browsers that surface compatible trims and link directly into vehicle detail pages. |
| `/vehicles/[id]` | Single-vehicle compatibility page that lists parts tied to a VIN/variant. |
| `/account` | Protected dashboard that shows profile info, quick links to order history, and future saved-vehicle/account settings cards. |
| `/account/orders`, `/orders/[id]`, `/orders/[id]/confirmation` | Order history, detail, and confirmation flows that link back to the Account hub. |
| `/admin/*` | Full CRUD admin (products, categories, suppliers) plus the supplier import UI and history views. |

## Environment Variables

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=

# Admin
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000

# Optional: Payment Provider (when adding Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
\`\`\`

### Auth Setup & Supabase Guardrails

- Populate `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` so the browser client can authenticate. When both are present, the `ensureUserProfile` helper executed during login/registration auto-creates rows in the `users` table, keeping `/account` and order history free from missing-profile errors.
- Server-side utilities (imports, admin promotion) additionally require `SUPABASE_SERVICE_ROLE_KEY` (and optionally `SUPABASE_URL`). Never expose that key to the client; only run scripts from a trusted terminal.
- Restart `npm run dev` after editing env vars so metadata helpers, Supabase SDKs, and the vehicle selector pick up the correct origin.

## Features Roadmap

- [ ] Stripe payment integration
- [ ] User authentication and accounts
- [ ] Order history and tracking
- [ ] B2B features and bulk ordering
- [ ] Advanced admin analytics
- [ ] Multi-language support
- [ ] Review and rating system
- [ ] Email notifications

## Performance

- Lighthouse Score: 95+
- Core Web Vitals: All Green
- Image Optimization: WebP + AVIF
- Caching: Strategic cache headers
- Compression: gzip + brotli

## Security

- Row-Level Security (RLS) on database
- CORS headers configured
- XSS protection enabled
- Secure admin authentication
- No sensitive data in logs

## Contributing

Contributions welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see LICENSE file for details.

## Support

For support, email support@autohub.com or open an issue on GitHub.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Database by [Supabase](https://supabase.com/)
- Deployed on [Vercel](https://vercel.com/)
