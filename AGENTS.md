# Repository Guidelines

## Project Structure & Module Organization
This is a Next.js 16 App Router workspace. Route handlers and server components live under `app/` (`app/vehicles/page.tsx`). Shared UI sits in `components/` (with shadcn-inspired building blocks under `components/ui`). Reusable hooks belong in `hooks/`, and domain logic plus Supabase helpers live in `lib/`. Static assets go in `public/`, while data utilities and imports live under `scripts/`.

## Build, Test, and Development Commands
- `npm run dev` – starts the local Next dev server with hot reload on `http://localhost:3000`.
- `npm run build` – produces the production bundle and validates route metadata.
- `npm start` – serves the output from `.next/` for smoke-testing production builds.
- `npm run lint` – runs the repo-wide ESLint config plus the built-in Next rules; use it before committing.

## Coding Style & Naming Conventions
Code is TypeScript-first with React 19 server components. Indent with two spaces and favor named exports per file (`export function VehicleSelector`). Components and hooks follow PascalCase and camelCase respectively, while directories stay kebab-case (`oil-selector`). Tailwind 4 utility classes are the primary styling mechanism; compose variants via `clsx`/`tailwind-merge` helpers where needed.

## Testing Guidelines
No automated test suite ships yet, so linting plus targeted manual QA is required. When adding tests, colocate them beside the feature in `app/<route>/__tests__/*.test.tsx` and cover both rendering and data hooks. Validate core flows (vehicle selector, checkout, Supabase reads) locally using realistic fixture data from `lib/mock-data.ts` before opening a PR.

## Commit & Pull Request Guidelines
History currently uses short, descriptive subjects (e.g., `Initial commit from Create Next App`), so continue writing imperative, <=72 character summaries such as `Add vehicle selector wizard`. Squash noisy commits before pushing. Every pull request should include: a concise description of the change, screenshots or GIFs for UI-impacting work, reproduction steps for bug fixes, and references to Jira/GitHub issues when applicable. Confirm `npm run lint` and a production build succeed before requesting review.

## Environment & Data Notes
Supabase clients are configured in `lib/supabase*.ts`; declare `SUPABASE_URL` and `SUPABASE_ANON_KEY` inside `.env.local` and never commit secrets. Use `scripts/` for data importers like `supplier-import.ts` rather than ad-hoc one-offs. When adding new env vars, document them in `README.md` and gate their usage with runtime checks to avoid leaking credentials in client components.

## 2025-11-25 – QA & Docs Notes
- Added `public/og-default.png` plus `lib/site-metadata.ts` and refreshed metadata for `/`, `/products`, `/brands/:id`, `/brands/:id/models/:modelId`, `/vehicles/:id`, and product detail pages to reference canonical URLs and the hosted OG/twitter fallback image.
- Implemented the `/account` dashboard (protected via client-side redirect) with profile summary, CTA cards (orders, saved vehicles placeholder, account details placeholder), and a local sign-out action.
- Touched navigation and order confirmation UX: header dropdown now links to `/account`, success view mentions the emailed receipt, and CTA buttons point to `/account` and `/orders/:id`.
- README now documents Supabase env setup/guardrails, supplier import workflow (UI + `/api/admin/import` payload/response + history view), and a route overview covering vehicle selector/OEM search, compatibility pages, and admin features.
- QA + verification:
  - `npm run lint` passes.
  - Started `npm run dev` (port 3200), resolved two build-time regressions: removed an extra closing `</div>` in `components/product-filters.tsx` and the duplicate `Button` import in `components/brand-detail.tsx`.
  - Used `curl` against `/`, `/products`, `/brands/brand-1`, `/brands/brand-1/models/model-mg4`, `/vehicles/vehicle-mg4-standard` to confirm `<title>`, meta description, canonical, and OG/twitter tags reflect the new copy and fallback image.
  - Ran Playwright (headful) smoke checks hitting `/`, `/products`, `/account` (redirect notice), cart, and checkout. Confirmed cart add → proceed to checkout path now warns unauthenticated users to sign in before payment.
