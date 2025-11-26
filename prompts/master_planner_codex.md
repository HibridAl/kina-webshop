This prompt is designed for a new Codex CLI session when planning further work on the AutoHub project. It incorporates the project’s structure and guidelines from the repository docs and assigns tasks to the appropriate tool. Always paste this prompt verbatim (with task‑specific details filled in) at the start of a planning session.

Context

The project is a Next.js 16 App Router workspace. Route handlers and server components reside in app/, shared UI lives in components/, reusable hooks are in hooks/, domain logic and Supabase helpers are in lib/, static assets go in public/, and data import scripts are in scripts/
.

Styling uses Tailwind CSS v4 with cva, clsx and tailwind‑merge. Components follow PascalCase and hooks use camelCase. Files/directories are kebab‑case and code is TypeScript‑first
.

Supabase clients are configured under lib/supabase\*.ts, with credentials loaded from .env.local. No secrets should appear in client components
.

Existing customer‑facing features include a product catalog, advanced filtering, product details, shopping cart, checkout, and a brand browser. The admin dashboard currently supports product, category and supplier management and an import pipeline
.

The README lists future roadmap items such as Stripe payment integration, user accounts, order history/tracking, B2B features, analytics, multi‑language support, review/rating system and email notifications.

Prompt
You are my primary implementation agent (Codex CLI) for AutoHub.

**Scope & constraints**

- Operate in the `codex_cli` role as defined in AGENTS.md and GEMINI.md. Do not change project files in this planning run.
- Use your MCP servers (filesystem, playwright/chrome‑devtools, sequential‑thinking, etc.) only to **inspect** the codebase and running app. Do not write or patch anything.
- Base your understanding on the project docs: README.md, AGENTS.md, GEMINI.md, and the existing roadmap.
- Respect the coding conventions: Next.js 16 App Router, React 19 server components, TypeScript, Tailwind CSS v4 utility classes and `cva`, two‑space indents, PascalCase components, camelCase hooks, kebab‑case directories:contentReference[oaicite:4]{index=4}.

**What to do**

1. **Assess the current state**

   - Examine `app/`, `components/`, `lib/`, `hooks/`, and `scripts/` to understand what is implemented (e.g., product catalog, filters, cart, checkout, admin features).
   - Optionally browse the running app at `http://localhost:3000/` (or the ngrok URL) to experience key flows: home/landing, product listing, product detail, cart, checkout, brand and vehicle pages, account dashboard and admin routes.
   - Identify incomplete or unimplemented parts relative to the roadmap: payment integration, auth, order history, B2B features, analytics, multi‑language, reviews, notifications, performance, error handling, testing, etc.

2. **Propose a realistic, production‑grade plan**

   - Think like a senior full‑stack engineer preparing the product for launch. Consider architecture, database schema, user flows, error handling, testing, security, and SEO.
   - Use the repository’s development commands (`npm run dev`, `npm run build`, etc.) and environment constraints (Supabase, Stripe keys, etc.) as given in README.md.
   - Break the work into sensible phases (e.g. Core commerce, Search & navigation, Vehicle data, Accounts & loyalty, Admin & operations, Content & SEO, Performance & QA).

3. **Create a detailed task table**

   - Assign each task to **exactly one** tool based on scope:
     - `codex_cli` → multi‑file or cross‑cutting changes (DB schema, API routes, state machines, payments, auth, admin logic, search helpers).
     - `gemini_cli` → UI/visual components and layout work, micro‑copy, design of new screens or components.
     - `codex_ide_cloud` / `codex_ide_local` → one‑file or very localized edits (copy changes, small class adjustments, metadata touch‑ups).
   - For each task, specify: a short ID (`T‑01`, `T‑02`, …), a concise title, a clear description, the files or areas it touches, the assigned tool, and dependencies (other tasks that must precede it).

4. **Output format**
   - Provide your findings as a Markdown document with three sections:
     - `## High‑level assessment` – 5–10 bullets summarizing what works today, what is missing, and overall code/UX quality.
     - `## Roadmap` – a short ordered list of phases with a sentence each.
     - `## Task list` – a table with columns: `ID`, `Title`, `Description`, `Scope`, `Tool`, `Dependencies`. Keep descriptions concise, avoid embedding long sentences in the table.

**Remember**: This prompt is for planning only. In subsequent steps, each task will be executed by the appropriate agent (Codex CLI, Gemini CLI or Codex IDE). Do not start implementation here.
