AutoHub Project Roadmap (November 2025)
High‑level assessment

The current AutoHub webshop already implements the core skeleton: a hero page with product discovery, a vehicle selector form, featured brands and category browsing on the home page
00cb16b19931.ngrok-free.app
. There is a product listing page with search/filter sidebar, though it currently shows zero products, and product detail pages are accessible directly
00cb16b19931.ngrok-free.app
. Brand pages list each manufacturer and allow navigation to model pages
00cb16b19931.ngrok-free.app
. Overall the UI uses Tailwind CSS, shadcn/ui components and Radix primitives.

The codebase is a Next.js 16 App‑Router project with TypeScript, server components, a lib/ folder for Supabase/DB helpers and a scripts/ folder for migrations. It relies on Supabase for data and authentication but currently uses demo data. There are no automated tests; manual QA and Playwright smoke tests are used【AGENTS.md†L16-L20】.

The README and documentation mention features like product catalog, advanced filtering, shopping cart, multi‑step checkout and admin dashboard for products, categories and suppliers【README.md†L1-L31】. Some of these are implemented, but production‑grade features such as real payments, shipping/tax calculations, wishlists, internationalization, and performance metrics are still missing.

The user supplied roadmap (below) outlines many improvements needed to turn the demo into a revenue‑ready shop. Major gaps include payment integration, shipping & tax logic, order lifecycle management, search suggestions, saved vehicles, account details, wishlists, roles & permissions, returns workflow, marketing content pages, and improved performance & QA.

Based on the tool assignment rules, large or cross‑cutting logic changes belong to Codex CLI; UI/visual work belongs to Gemini CLI; and one‑file fixes belong to the Codex IDE (cloud/local). The following tasks split the roadmap accordingly.

Roadmap phases

Commerce & Checkout: implement payments, shipping/tax, guest checkout and order lifecycle/admin. These require new DB tables, state machines and API routes (Codex CLI), plus checkout/admin UI adjustments (Gemini CLI).

Catalog & Search: improve search by adding full‑text indexing, search suggestions and autocomplete, refine faceted filters and handle empty states (mix of Codex CLI and Gemini CLI).

Vehicle Data & Compatibility: add “My Garage”, compatibility coverage dashboard and refine oil selector recommendations; split logic (Codex CLI) and UI (Gemini CLI).

Account & Engagement: extend the /account area with address book, wishlists and better order history; integrate transactional email hooks.

Admin & Operations: implement role‑based access control, bulk catalog editing, returns/RMA workflow and better monitoring for supplier imports.

Content, Marketing & SEO: replace placeholder pages (FAQ, Shipping, Returns, Privacy, Terms) with real content via MDX or CMS, add blog/guides, experiment flags and internationalization.

Performance, Reliability & QA: write automated Playwright tests, optimize DB queries and API performance, add error tracking/logging and Lighthouse/Core Web Vitals improvements.

Small tasks: microcopy tweaks, footer link updates, layout fixes and metadata adjustments. These are suitable for Codex IDE.

Task list
ID Title Tool Scope Dependencies
T1 Implement payment integration codex_cli Create payments table, webhook handler (app/api/webhooks/stripe/route.ts), checkout server actions, state machine –
T2 Add shipping & tax logic codex_cli Add shipping_methods table, tax/VAT calculation helper (lib/pricing.ts), update order schema –
T3 Checkout UI: shipping & tax gemini_cli Update /checkout page to choose shipping method and display live totals T2
T4 Support guest checkout codex_cli Adjust auth/route guards, link orders to email when no account exists –
T5 Order lifecycle logic codex_cli Introduce order statuses (pending/paid/shipped/cancelled), admin transitions in API –
T6 Admin orders UI enhancements gemini_cli Update /admin/orders to filter by status and show metrics T5
T7 Full‑text search index codex_cli Add PG full‑text index on products and search helper in lib/db.ts –
T8 Search suggestions API codex_cli Implement /api/search/suggest returning suggestions and popular queries –
T9 Autocomplete dropdown gemini_cli Add suggestion dropdown to header search bar with keyboard navigation T8
T10 Faceted filters logic codex_cli Precompute filter counts (category/brand/stock) and persist filter presets –
T11 Faceted filters UI gemini_cli Add counts, “clear all” and “save filter preset” buttons to filters T10
T12 Empty‑state suggestions gemini_cli Show tailored suggestions when OEM or vehicle filter returns no products –
T13 Saved vehicles logic codex_cli Add my_vehicles table, API actions and hooks to save/select vehicles –
T14 My Garage UI gemini_cli Implement “Save this vehicle” button and garage selector on products page T13
T15 Compatibility coverage dashboard (logic) codex_cli Create admin route aggregating vehicle compatibility counts –
T16 Compatibility dashboard UI gemini_cli Build admin page/table to display coverage and export CSV T15
T17 Oil selector refinement logic codex_cli Use manufacturer data to map vehicles to oils with human‑friendly labels –
T18 Oil selector & upsell UI gemini_cli Add recommended‑oil panels on vehicle detail and checkout pages T17
T19 Account address book logic codex_cli Extend /account API to manage name, phone and shipping/billing addresses –
T20 Account address book UI gemini_cli Add forms and layout for addresses under /account T19
T21 Order history UX gemini_cli Show thumbnails, status badges and reorder button on /account/orders –
T22 Wishlists logic codex_cli Create wishlists/saved_items table and actions to add/remove items –
T23 Wishlists UI gemini_cli Add heart icons on product cards and /account/wishlist page T22
T24 Transactional email hooks codex_cli Integrate email provider for order confirmations and password resets –
T25 Role‑based permissions codex_cli Extend users table with roles and restrict admin sections accordingly –
T26 Bulk catalog editing logic codex_cli Add admin actions and API to perform bulk price/status updates, export CSV –
T27 Bulk editing UI gemini_cli Build UI for mass edits and CSV export in admin dashboard T26
T28 Returns & RMA logic codex_cli Create returns table, reasons, status flows and link to orders/items –
T29 Returns & RMA UI gemini_cli Implement admin interface to approve/deny returns and track refunds T28
T30 Supplier import monitoring logic codex_cli Extend import history API to include per‑run error summaries and metrics –
T31 Import monitoring UI gemini_cli Add charts/components to admin to display import success/failure counts T30
T32 Content pages loader codex_cli Set up MDX/CMS loader and routes for FAQ, Shipping, Returns, Privacy, Terms –
T33 Content page layouts gemini_cli Design page layout and typography for marketing/static pages T32
T34 Blog/guides infrastructure codex_cli Add /guides section with MDX or CMS‑sourced posts and SEO metadata –
T35 Blog/guides UI gemini_cli Design article pages and index layout T34
T36 Experiment flag system codex_cli Implement simple experiment flags (via Supabase or Edge Config) –
T37 Experiment variant UIs gemini_cli Design alternate hero/CTA/sort variants for A/B tests T36
T38 Internationalization logic codex_cli Add i18n infrastructure and language files (starting with English) –
T39 Language switcher UI gemini_cli Add language switcher component and adjust layouts for other locales T38
T40 Playwright E2E scenarios codex_cli Write automated E2E tests for browse, search, vehicle selection, cart, checkout, login and admin flows –
T41 API & DB performance tuning codex_cli Profile heavy queries (products list, OEM search) and add indexes –
T42 Error tracking & logging codex_cli Integrate Sentry or similar for client/server errors and structured logging –
T43 Lighthouse/Core Web Vitals tweaks gemini_cli Address layout shifts, image sizing and reduce JS on key pages –
T44 Microcopy & UX text tweaks codex_ide_cloud Improve copy in empty states, error messages and CTAs (one file at a time) –
T45 Footer link updates codex_ide_cloud Replace href="#" in components/footer.tsx with real routes once content pages exist –
T46 Minor layout/padding adjustments codex_ide_local Tweak spacing or breakpoints in a single component when issues are observed via devtools –
T47 Metadata touch‑ups codex_ide_local Update metadata.description fields in a single route file when copy is off –
Notes on tool assignment

codex_cli tasks involve schema migrations, API routes, server components, database helpers, or cross‑cutting code that spans multiple files. Use the provided planning prompt to generate a step‑by‑step plan and apply changes via patches.

gemini_cli tasks focus on visual design, components, layout, styling and microcopy. Use the UI component specialist prompt to propose and implement React/TSX components using Tailwind and shadcn/ui primitives.

codex_ide_cloud and codex_ide_local tasks are reserved for small, scoped changes within a single file. Use the IDE extension when you are already working in the editor – the only difference between the cloud and local versions is whether the environment is remote or local.
