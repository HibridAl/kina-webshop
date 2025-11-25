# AutoHub Project Context

## Project Overview
AutoHub is a modern, full-stack e-commerce platform specializing in Chinese automotive parts (MG, BYD, Omoda, Geely, Haval). It utilizes **Next.js 16** with the **App Router**, **TypeScript**, **Tailwind CSS v4**, and **Supabase** for backend services (Auth, Database).

### Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4, `tailwind-merge`, `clsx`, `class-variance-authority`
- **UI Library:** Radix UI primitives, Lucide React icons
- **Backend/DB:** Supabase (PostgreSQL, Auth, Row Level Security)
- **Forms/Validation:** React Hook Form, Zod
- **Package Manager:** npm

## Architecture & Structure
- **`app/`**: Contains the App Router file-system based routing.
    - `(public)`: Customer-facing pages (products, cart, checkout).
    - `admin/`: Admin dashboard pages.
    - `api/`: Backend API routes.
- **`components/`**: React components.
    - `ui/`: Reusable atomic components (Buttons, Inputs, etc.) built with Radix UI and cva.
    - Feature-specific components (e.g., `product-card.tsx`, `cart-summary.tsx`) live at the root or in folders.
- **`lib/`**: Core logic and utilities.
    - `supabase.ts`: Supabase client initialization.
    - `db.ts`: Database helper functions.
    - `utils.ts`: Common styling utilities (`cn`).
- **`hooks/`**: Custom React hooks (e.g., `use-cart.ts`, `use-auth.ts`).
- **`scripts/`**: Database migration SQL files and data ingestion scripts (`bootstrap-admin.ts`, `ingest-autok-to-supabase.ts`).

## Building & Running
- **Development Server:**
  ```bash
  npm run dev
  ```
  Runs on `http://localhost:3000`.

- **Production Build:**
  ```bash
  npm run build
  npm run start
  ```

- **Linting:**
  ```bash
  npm run lint
  ```

## Development Conventions
- **Styling:** Use Tailwind CSS v4 utility classes. Compose complex styles using `cva` and `cn` helper.
- **Component Naming:** PascalCase for components (e.g., `VehicleSelector`).
- **Hook Naming:** camelCase for hooks (e.g., `useCart`).
- **File/Directory Naming:** kebab-case for files and directories (e.g., `oil-selector/page.tsx`).
- **State Management:** Prefer React Server Components for data fetching. Use client-side state (hooks) only when interactivity is required.
- **Testing:** Currently relies on manual QA. Tests, when added, should be colocated with features.

## Database & Admin
- **Supabase:** Used for data persistence and authentication.
- **Migrations:** SQL files are located in `scripts/` (e.g., `00-schema.sql`).
- **Admin Setup:** Requires creating a user and running `scripts/bootstrap-admin.ts` to grant admin privileges.
- **Environment Variables:** Managed in `.env.local`. Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
