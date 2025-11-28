High‑level assessment
Core customer flows (browse → product detail → cart → checkout → order confirmation) are implemented end‑to‑end, with Supabase‑backed products, carts and orders when configured and robust mock data fallbacks otherwise.
Catalog UX is strong: there is a dedicated /products page with OEM search, keyword search, faceted filtering (brand, category, price, stock), pagination and vehicle‑based compatibility filtering wired to the vehicle selector and compatibility tables.
Vehicle data and fitment flows are in good shape: home page and /products integrate a three‑step vehicle selector; brand/model/vehicle detail pages pull from Supabase or mock data; compatibility routes and the /vehicles/[id] page surface known‑fit products; /oil-selector reads manufacturer data via Supabase when the ingestion script has been run.
Account and orders are partially built out: Supabase auth/login/register are in place, /account provides a dashboard and sign‑out, /account/orders lists orders from Supabase, and /orders/[id] + /orders/[id]/confirmation handle both real and mock orders with graceful fallbacks when Supabase isn’t configured.
The admin surface covers key operations: there are routes for login/setup, a dashboard, product CRUD, categories, suppliers and a rich supplier import workflow that posts to /api/admin/import and tracks basic import run history.
Schema and data layer are ahead of the UI: SQL migrations define brands/models/vehicles/products, carts, orders, order_items, order_payments, RLS policies and indexes; lib/db.ts exposes helpers for products, compatibility, carts and orders, but payments, returns and some account features are still unused.
Payment and order lifecycle logic are still demo‑grade: checkout collects card details but does not integrate any provider (e.g. Stripe), orders are created with a static pending status, order_payments is unused, and there is no /admin/orders view for fulfillment workflows.
Engagement features are thin: password reset is a stub, there is no address book, wishlists, saved vehicles “garage”, reviews/ratings or transactional emails (order confirmation, password reset, shipping updates).
Operational and quality layers are incomplete: there is no error tracking (e.g. Sentry), no structured server logging, performance tuning is minimal, and while Playwright is present and used manually, there is no committed automated test suite or CI‑style QA story.
Content and growth features are largely missing: static content pages (FAQ, Shipping, Returns, Privacy, Terms), guides/blog, experiment flags/A‑B tests, and internationalization/language switching are not yet implemented, though metadata, OG tags and JSON‑LD are already well structured.
Roadmap
Core Commerce & Payments – Harden checkout by integrating a real payment provider, wiring order_payments and status transitions, and adding an admin orders view for fulfillment and refunds.
Catalog, Search & Navigation – Improve search quality and discovery via full‑text indexing, suggestions/autocomplete, richer faceted filters and better empty states to keep users in the funnel.
Vehicle Data & Selector – Expand on the existing vehicle selector, compatibility and oil selector to add “My Garage”, coverage dashboards and more opinionated recommendations/upsells.
Accounts, B2B & Engagement – Grow /account into a proper hub with address book, wishlist, saved vehicles, richer order history UX, B2B account flags and transactional email hooks.
Admin & Operations – Add role‑based permissions, bulk catalog editing, returns/RMA workflows and better monitoring around supplier imports and catalog health.
Content, SEO & Internationalization – Introduce MDX/CMS‑backed content pages, a guides/blog section, experiment flags for marketing tests and foundational i18n with a language switcher.
Observability, Performance & QA – Integrate error tracking and structured logging, tune heavy queries, address CWV/Lighthouse issues and add Playwright E2E coverage for critical user and admin flows.
Polish & Micro‑UX – Iterate on copy, layout and metadata at a file‑level to remove remaining rough edges without large structural changes.
Task list
ID Title Description Scope Tool Dependencies Status
T-01 Implement payment integration Connect checkout to Stripe (or similar), record payments and handle asynchronous webhooks. scripts/00-schema.sql (ensure order_payments ready), lib/db.ts, app/api/webhooks/stripe/route.ts, app/checkout/page.tsx codex_cli –
T-02 Add shipping & tax logic Introduce shipping methods and basic tax/VAT helpers and surface them in order totals. New lib/pricing.ts, scripts/00-schema.sql (shipping methods), app/checkout/page.tsx, lib/db.ts codex_cli T-01
T-03 Checkout UI: shipping & tax Update checkout to select shipping method, display itemized totals and show payment status. app/checkout/page.tsx, components/cart-summary.tsx, components/order-summary (if added) gemini_cli T-02
T-04 Support guest checkout Allow orders without a Supabase user while still associating them to an email identity. app/checkout/page.tsx, lib/db.ts (order creation), scripts/00-schema.sql (optional guest fields) codex_cli T-01
T-05 Order lifecycle logic Implement status transitions and helper APIs for pending/paid/shipped/cancelled orders. lib/db.ts (order update helpers), new /app/api/orders/[id]/status route, scripts/00-schema.sql (statuses) codex_cli T-01
T-06 Admin orders UI Add an /admin/orders section to filter, inspect and update orders and payments. New app/admin/orders/page.tsx, components/admin-order-list.tsx, components/admin-order-detail.tsx gemini_cli T-05
T-07 Full‑text product search Add PostgreSQL full‑text index and a typed search helper for products. scripts/00-schema.sql (GIN index), lib/db.ts (full‑text query), lib/types.ts codex_cli –
T-08 Search suggestions API Provide suggestions and popular queries for header search and OEM lookup. New app/api/search/suggest/route.ts, lib/db.ts (aggregation), lib/types.ts codex_cli T-07
T-09 Header search autocomplete Add an autocomplete dropdown with keyboard navigation on the main search bar. components/header.tsx, new components/search-autocomplete.tsx gemini_cli T-08
T-10 Faceted filters backend Precompute filter counts and persist saved filter presets for catalog browsing. lib/db.ts (aggregate queries), new tables in scripts/00-schema.sql (filter presets), lib/types.ts codex_cli –
T-11 Faceted filters UI Show counts, “clear all” and “save preset” actions in filter sidebar. components/product-filters.tsx, components/products-toolbar.tsx gemini_cli T-10
T-12 Empty‑state suggestions Present tailored suggestions when OEM/vehicle filters yield zero products. components/products-page-client.tsx, components/product-grid.tsx gemini_cli –
T-13 Saved vehicles backend Persist users’ frequently used vehicles as a “garage” for quick selection. New my_vehicles table in scripts/00-schema.sql, lib/db.ts + lib/types.ts, lib/auth.ts (profile flags) codex_cli –
T-14 My Garage UI Let users save a vehicle from detail pages and pick from their garage in catalog/checkout. components/vehicle-detail.tsx, components/vehicle-selector.tsx, new components/my-garage-menu.tsx, /account gemini_cli T-13
T-15 Compatibility coverage API Expose coverage metrics (vehicles with fitment, gaps) for admin reporting. New /app/api/admin/compatibility/route.ts, lib/db.ts, scripts/00-schema.sql (materialized views if needed) codex_cli –
T-16 Compatibility dashboard UI Build an admin dashboard visualizing compatibility coverage and export options. New app/admin/compatibility/page.tsx, components/admin-compatibility-dashboard.tsx gemini_cli T-15
T-17 Oil selector refinement logic Normalize manufacturer data into friendlier labels and map to internal SKUs. lib/oil-selector.ts, scripts/02-oil-selector.sql, scripts/ingest-autok-to-supabase._ codex_cli –
T-18 Oil selector & upsell UI Surface oil recommendations and compatible products on vehicle and checkout pages. components/vehicle-oil-selector.tsx, components/vehicle-detail.tsx, app/checkout/page.tsx gemini_cli T-17
T-19 Account address book backend Model and expose user shipping/billing addresses with basic CRUD. New addresses table in scripts/00-schema.sql, lib/db.ts (address helpers), lib/types.ts, /app/api/account codex_cli –
T-20 Account address book UI Add address management forms and UI under /account. app/account/page.tsx, new app/account/addresses/page.tsx, components/account-address-form.tsx gemini_cli T-19
T-21 Order history UX polish Enhance /account/orders with thumbnails, status chips and basic “reorder” support. app/account/orders/page.tsx, components/order-list.tsx, lib/db.ts (reorder helper) gemini_cli T-05
T-22 Wishlists backend Persist wishlists/saved items linked to products and users. New wishlists/wishlist_items tables in scripts/00-schema.sql, lib/db.ts, lib/types.ts codex_cli –
T-23 Wishlists UI Add heart icons to product cards and a wishlist page under /account. components/product-card.tsx, new app/account/wishlist/page.tsx gemini_cli T-22
T-24 Transactional email hooks Integrate an email provider for order confirmation and password reset flows. lib/auth.ts, lib/db.ts (order events), new lib/email.ts, app/checkout/page.tsx, app/auth/reset-password/page.tsx codex_cli T-01
T-25 Role‑based permissions Enforce roles for admin access and prepare for B2B pricing/controls. scripts/00-schema.sql (users.role/is_b2b policies), lib/auth.ts, app/admin/layout.tsx, app/admin/login/page.tsx codex_cli –
T-26 Bulk catalog editing backend Support bulk price/status edits and CSV exports in admin. New admin API routes under /app/api/admin/products/bulk, lib/db.ts, scripts/00-schema.sql codex_cli –
T-27 Bulk catalog editing UI Build mass‑edit and export interfaces in the admin dashboard. app/admin/products/page.tsx, new components/admin-product-bulk-editor.tsx gemini_cli T-26
T-28 Returns & RMA backend Model returns, reasons and status flows tied to orders/items. New returns tables in scripts/00-schema.sql, lib/db.ts, lib/types.ts, /app/api/returns codex_cli T-05
T-29 Returns & RMA UI Provide admin tools to manage RMAs and link them from orders. New app/admin/returns/page.tsx, updates to app/orders/[id]/page.tsx, admin order detail components gemini_cli T-28
T-30 Supplier import monitoring backend Extend import history with error summaries and metrics per run. lib/supplier-import.ts, scripts/00-schema.sql (supplier_import_runs), new /app/api/admin/import/history codex_cli –
T-31 Supplier import monitoring UI Visualize import success/failure rates and recent runs in admin. app/admin/suppliers/[id]/import-history.tsx, components/admin-import-metrics.tsx gemini_cli T-30
T-32 Content pages loader Load FAQ/Shipping/Returns/Privacy/Terms content from MDX or CMS. New content loader in lib/content.ts, scripts (optional seed), app/(marketing)/[slug]/page.tsx codex_cli –
T-33 Content page layouts Design layouts and typography for static marketing/legal pages. app/(marketing)/[slug]/page.tsx, components/marketing-layout.tsx gemini_cli T-32
T-34 Blog/guides infrastructure Add a guides/blog section with SEO‑friendly routing and metadata. app/guides/[slug]/page.tsx, lib/content.ts, lib/site-metadata.ts codex_cli T-32
T-35 Blog/guides UI Implement article and index layouts for guides/blog. app/guides/page.tsx, components/guide-card.tsx, components/guide-article.tsx gemini_cli T-34
T-36 Experiment flag system Introduce a lightweight feature flag/experiment framework. New lib/experiments.ts, optional use of Edge Config or Supabase, wrappers in app/layout.tsx and key pages codex_cli –
T-37 Experiment variant UIs Create alternate hero/CTA/sort treatments for A/B testing. components/hero-section.tsx, components/products-toolbar.tsx, experiment‑aware variants gemini_cli T-36
T-38 Internationalization backend Set up i18n infrastructure and locale files (starting with English). next.config.ts (i18n), lib/i18n.ts, message catalogs under public/locales, wrappers in app/layout.tsx codex_cli –
T-39 Language switcher UI Add a locale switcher and ensure layouts handle translated copy. components/header.tsx, components/footer.tsx, new components/language-switcher.tsx gemini_cli T-38
T-40 Playwright E2E scenarios Codify smoke paths into repeatable E2E tests for critical flows. New e2e/_.spec.ts files, playwright.config.ts, CI script via package.json codex_cli –
T-41 API & DB performance tuning Profile and optimize heavy queries (catalog, OEM search, compatibility, imports). lib/db.ts, scripts/00-schema.sql (indexes), optional scripts/run-migrations.ts adjustments codex_cli –
T-42 Error tracking & logging Integrate Sentry (or similar) and establish structured logging patterns. New sentry.client.config._ and sentry.server.config._, app/layout.tsx, lib/utils.ts (logger helper) codex_cli –
T-43 Lighthouse & CWV tweaks Address layout shift, image sizing and bundle bloat on key pages. app/layout.tsx, components/hero-section.tsx, components/product-card.tsx, Next image usage gemini_cli –
T-44 Reviews & ratings backend Add product review and rating models with basic moderation. New reviews table in scripts/00-schema.sql, lib/db.ts, lib/types.ts, /app/api/reviews codex_cli T-01
T-45 Reviews UI Show ratings and review lists/forms on product detail pages. components/product-detail-page.tsx, new components/review-list.tsx, components/review-form.tsx gemini_cli T-44
T-46 Microcopy & UX text tweaks Refine key copy in empty/error states and CTAs. Single‑file edits in components/_ and app/_ (per occurrence) codex_ide_cloud – TODO
T-47 Footer link updates Replace placeholder footer links with real routes as content appears. components/footer.tsx codex_ide_cloud T-32 TODO
T-48 Minor layout/padding adjustments Tweak spacing/breakpoints in individual components in response to real‑world QA. Single components (e.g. components/cart-summary.tsx, components/header.tsx) codex_ide_local – DONE (see PLAN_TO_DO_2025-11-28.md)
T-49 Metadata & SEO touch‑ups Adjust per‑route metadata descriptions/titles when copy changes. Individual route files under app/\*/page.tsx using metadata/generateMetadata codex_ide_local – DONE (see PLAN_TO_DO_2025-11-28.md and follow-up steps T-49.1–T-49.6)

Notes on tool assignment

codex_cli tasks involve schema migrations, API routes, server components, database helpers, or cross‑cutting code that spans multiple files. Use the provided planning prompt to generate a step‑by‑step plan and apply changes via patches.

gemini_cli tasks focus on visual design, components, layout, styling and microcopy. Use the UI component specialist prompt to propose and implement React/TSX components using Tailwind and shadcn/ui primitives.

codex_ide_cloud and codex_ide_local tasks are reserved for small, scoped changes within a single file. Use the IDE extension when you are already working in the editor – the only difference between the cloud and local versions is whether the environment is remote or local.
