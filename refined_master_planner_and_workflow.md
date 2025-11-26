Refined Master‑Planner Prompt and Workflow Instructions
1 Master‑planner prompt for Codex CLI

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

**Remember**: This prompt is for planning only. In subsequent steps, each task will be executed by the appropriate agent (Codex CLI, Gemini CLI or Codex IDE). Do not start implementation here.

2 Workflow setup & usage instructions
2.1 Project files to anchor context

Ensure the following files are present at the root of the project and kept up to date:

File Purpose
README.md Overview of features, getting started, database & admin setup, route summary, roadmap
.
AGENTS.md Project guidelines: structure, coding conventions, testing, commit rules, environment notes
.
GEMINI.md AutoHub context: tech stack, folder overview and development conventions.
roadmap.md The current task list with IDs, titles, descriptions, scopes, assigned tools and dependencies.

When beginning a new session with any tool, reference these documents to restore context.

2.2 Starting a new Codex CLI session

Initialize the session in the project root.

Paste the refined master‑planner prompt above to generate or update roadmap.md. Include any file IDs or URLs the prompt references (e.g. ngrok link) before running it.

Save the generated roadmap to roadmap.md (if it differs from the existing one). Use computer.sync_file to sync the updated file so it can be referenced later.

For each task assigned to codex_cli in the roadmap:

Begin a new interaction with a short preamble: identify the task ID and copy its title, description, scope and dependencies from roadmap.md.

Restate the task in your own words, list the files you plan to modify, and proceed to implement it using the Codex CLI patch mechanism. Follow the coding conventions and commit guidelines from AGENTS.md
.

After completing the task, update the roadmap.md to mark it done or adjust dependencies. Sync the file again.

2.3 Using Gemini CLI

Create or open a Gemini CLI session when you encounter a task tagged gemini_cli.

Load the project context by pasting the contents of GEMINI.md (or a summary thereof) along with the task’s ID, title, description and scope from roadmap.md.

Instruct Gemini to design or refine UI components/layouts without altering business logic. It should propose component structure, states, props and return complete TSX code with Tailwind and shadcn primitives. Integration snippets should show how to use the component in existing pages.

Manually incorporate the generated component into the codebase via a Codex CLI or IDE session (Gemini cannot directly modify files). Update the roadmap accordingly.

2.4 Codex IDE (Cloud and Local)

Use the Codex IDE extension for single‑file or very localized edits (codex_ide_cloud when working in a browser‑based IDE or codex_ide_local when using VS Code locally).

Always select the specific file or code block before sending a prompt. Use a concise instruction, e.g.,

You are acting as the small‑change agent (`codex_ide_local`). Only modify the selected file. Task: Replace the placeholder links in `components/footer.tsx` with the correct routes (FAQ, Shipping, Returns, Privacy, Terms).

Do not create new files or alter other modules in this mode. Sync changes back to the shared roadmap and mark the task complete.

2.5 General guidance

Never expose secrets: keep Supabase keys and Stripe secrets in .env.local and do not log them. Use the helpers in lib/supabase.ts for DB access
.

Follow the project’s naming and style conventions: two‑space indents, PascalCase components, camelCase hooks, kebab‑case file/folder names, Tailwind utility classes
.

Respect environment notes: when adding new env vars, document them in README.md and gate usage behind runtime checks
.

Keep tasks small and focused: each task should be achievable in a single session by one agent. Larger initiatives must be broken down.

This refined prompt and workflow should help you produce a structured roadmap and collaborate efficiently across Codex CLI, Gemini CLI and the Codex IDE.
