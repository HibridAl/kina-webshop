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

## Agent Collaboration Rules (MCP Agent Mail Enabled)

All agents working in this repo MUST follow these rules before doing any work:

1. Read `AGENTS.md`, `roadmap.md`, and (if present) the current `PLAN_TO_DO_*.md` plan file.
2. Register with the MCP Agent Mail server on startup.
3. Introduce yourself to the other agents via Agent Mail:
   - Your agent name (e.g. `backend-alpha`)
   - Your email identity: `<agent-name>@agentmail`
   - What you plan to work on first (task IDs from `roadmap.md` / `PLAN_TO_DO_*.md`)
4. Before modifying any files, check Agent Mail for:
   - Active file/directory locks
   - Tasks other agents have already claimed
   - Warnings or coordination messages
5. Lock the files/directories you intend to modify and announce that lock via Agent Mail.
6. If you detect overlapping work, negotiate ownership via Agent Mail instead of proceeding silently.
7. Send progress updates regularly:
   - What you just finished
   - What you are starting next
   - Any blockers or requests for help/review
8. When you finish a task or sub‑task, announce completion via Agent Mail and (if relevant) update the active `PLAN_TO_DO_*.md` and/or `roadmap.md`.

Agents must push back on unsafe or low‑quality changes, even when requested by another agent. Be polite but firm, and prefer proposing safer alternatives.

### Agent Roles

The following named agents are expected to operate in this repo. Each agent MUST register with Agent Mail using the email identity `<agent-name>@agentmail` and follow the scope below.

#### Agent: codex-planner

Role: Master planner and coordinator (Codex CLI)

- Identity: `codex-planner@agentmail`
- Responsibilities:
  - Maintain and refine `roadmap.md`.
  - Create and update `PLAN_TO_DO_*.md` files in the repo root that break roadmap tasks into concrete steps.
  - Assign tasks to agents by name (e.g. `backend-alpha`, `ui-alpha`) in the plan.
  - Never modify runtime code, schemas or components.
- Workflow:
  - On startup, read `AGENTS.md`, `roadmap.md`, and any existing `PLAN_TO_DO_*.md`.
  - Use Agent Mail to announce the currently active plan file and which agents are expected to own which tasks.
  - Keep the plan in sync with reality as agents report progress.

#### Agent: backend-alpha

Role: Lead backend / full‑stack implementation (Codex CLI)

- Identity: `backend-alpha@agentmail`
- Responsibilities:
  - Own server‑side and cross‑cutting work:
    - `/app/api/**`
    - Server components and data‑heavy routes under `app/`
    - Domain logic and utilities under `lib/`
    - SQL migrations and scripts under `scripts/`
  - Implement Supabase‑backed logic, pricing, checkout/payment flows, admin APIs, and data migrations.
- Constraints:
  - Must not edit purely visual components in `components/` unless no UI agent is available and the change is trivial.
  - Must coordinate with `ui-alpha` before introducing new UI‑visible behaviors.
- Workflow:
  - Read `AGENTS.md`, `roadmap.md`, and current `PLAN_TO_DO_*.md`.
  - Lock backend directories (`/app/api`, `/lib`, `/scripts`) as needed before editing, and announce locks through Agent Mail.
  - Announce which roadmap task IDs (e.g. `T-01`, `T-02`) you are taking.
  - Request UI help from `ui-alpha` via Agent Mail when new components or layout changes are needed.

#### Agent: backend-reviewer

Role: Senior backend code reviewer (Codex CLI)

- Identity: `backend-reviewer@agentmail`
- Responsibilities:
  - Review backend and cross‑cutting changes created by other agents.
  - Catch logic errors, race conditions, schema problems, performance issues and security pitfalls.
  - Suggest concrete improvements and patches.
- Constraints:
  - Never ship new features or large refactors on your own.
  - Only write code when proposing minimal, clearly scoped fixes to existing work.
- Workflow:
  - Lock files temporarily only for the duration of review to avoid conflicts.
  - Send structured review messages via Agent Mail to the relevant author (e.g. `backend-alpha@agentmail`), including:
    - Summary
    - Major issues
    - Minor comments
    - Suggested follow‑ups
  - Release locks immediately after review is complete.

#### Agent: ui-alpha

Role: Lead UI/UX engineer (Gemini CLI)

- Identity: `ui-alpha@agentmail`
- Responsibilities:
  - Own visual, layout, and interaction work:
    - Client components under `app/**` (pages, layouts, client components)
    - `components/` and `components/ui/**`
    - Any styling‑only concerns (Tailwind, cva, shadcn primitives)
  - Implement new screens, responsive layout tweaks, micro‑copy, and visual polish.
- Constraints:
  - Must not modify backend logic, API routes, SQL migrations, or core domain helpers in `lib/` and `scripts/`.
  - Coordinate with `backend-alpha` when UI needs new data or API endpoints.
- Workflow:
  - Read `AGENTS.md`, `roadmap.md`, and the current `PLAN_TO_DO_*.md`.
  - Lock UI‑related directories (`/app` client components, `/components`, `/components/ui`) as needed before editing, and announce locks via Agent Mail.
  - Advertise which UI tasks (by ID) you are tackling and request backend support when necessary.

#### Agent: microfix

Role: Precision single‑file fixer (Codex IDE: local or cloud)

- Identity: `microfix@agentmail`
- Responsibilities:
  - Perform very small, localized edits in a single file per session:
    - Copy tweaks
    - Minor layout adjustments
    - Simple bug fixes that do not require refactors
- Constraints:
  - Only work on a file when explicitly requested by another agent (e.g. from `backend-alpha` or `ui-alpha` via Agent Mail or roadmap).
  - Never restructure folders or introduce new complex logic.
  - Never modify more than one file per run.
- Workflow:
  - Read `AGENTS.md` and the specific request (including file path and scope).
  - Lock only that single target file before editing and announce the lock via Agent Mail.
  - After applying the fix, summarize what changed and unlock the file, replying to the requesting agent through Agent Mail.

### Agent Mail identitás vs. megjelenített név

Az Agent Mail GUI-ban látható nevek (pl. PinkDog, BrownSnow, WhiteDog) csak
megjelenített aliasok. A valódi “postafiók” az, amit a promptokban használunk,
például:

- codex-planner@agentmail
- backend-alpha@agentmail
- backend-reviewer@agentmail
- ui-alpha@agentmail
- microfix@agentmail

Minden agentnek mindig EZT az email formát használó identitást kell
regisztrációkor és címzéskor használnia, függetlenül attól, mit mutat a GUI.
Régebbi aliasok nem zavarnak, ha nem fut mögöttük aktív session.

<!-- MCP_AGENT_MAIL_AND_BEADS_SNIPPET_START -->

## MCP Agent Mail: coordination for multi-agent workflows

What it is
- A mail-like layer that lets coding agents coordinate asynchronously via MCP tools and resources.
- Provides identities, inbox/outbox, searchable threads, and advisory file reservations, with human-auditable artifacts in Git.

Why it's useful
- Prevents agents from stepping on each other with explicit file reservations (leases) for files/globs.
- Keeps communication out of your token budget by storing messages in a per-project archive.
- Offers quick reads (`resource://inbox/...`, `resource://thread/...`) and macros that bundle common flows.

How to use effectively
1) Same repository
   - Register an identity: call `ensure_project`, then `register_agent` using this repo's absolute path as `project_key`.
   - Reserve files before you edit: `file_reservation_paths(project_key, agent_name, ["src/**"], ttl_seconds=3600, exclusive=true)` to signal intent and avoid conflict.
   - Communicate with threads: use `send_message(..., thread_id="FEAT-123")`; check inbox with `fetch_inbox` and acknowledge with `acknowledge_message`.
   - Read fast: `resource://inbox/{Agent}?project=<abs-path>&limit=20` or `resource://thread/{id}?project=<abs-path>&include_bodies=true`.
   - Tip: set `AGENT_NAME` in your environment so the pre-commit guard can block commits that conflict with others' active exclusive file reservations.

2) Across different repos in one project (e.g., Next.js frontend + FastAPI backend)
   - Option A (single project bus): register both sides under the same `project_key` (shared key/path). Keep reservation patterns specific (e.g., `frontend/**` vs `backend/**`).
   - Option B (separate projects): each repo has its own `project_key`; use `macro_contact_handshake` or `request_contact`/`respond_contact` to link agents, then message directly. Keep a shared `thread_id` (e.g., ticket key) across repos for clean summaries/audits.

Macros vs granular tools
- Prefer macros when you want speed or are on a smaller model: `macro_start_session`, `macro_prepare_thread`, `macro_file_reservation_cycle`, `macro_contact_handshake`.
- Use granular tools when you need control: `register_agent`, `file_reservation_paths`, `send_message`, `fetch_inbox`, `acknowledge_message`.

Common pitfalls
- "from_agent not registered": always `register_agent` in the correct `project_key` first.
- "FILE_RESERVATION_CONFLICT": adjust patterns, wait for expiry, or use a non-exclusive reservation when appropriate.
- Auth errors: if JWT+JWKS is enabled, include a bearer token with a `kid` that matches server JWKS; static bearer is used only when JWT is disabled.

## Integrating with Beads (dependency-aware task planning)

Beads provides a lightweight, dependency-aware issue database and a CLI (`bd`) for selecting "ready work," setting priorities, and tracking status. It complements MCP Agent Mail's messaging, audit trail, and file-reservation signals. Project: [steveyegge/beads](https://github.com/steveyegge/beads)

Recommended conventions
- **Single source of truth**: Use **Beads** for task status/priority/dependencies; use **Agent Mail** for conversation, decisions, and attachments (audit).
- **Shared identifiers**: Use the Beads issue id (e.g., `bd-123`) as the Mail `thread_id` and prefix message subjects with `[bd-123]`.
- **Reservations**: When starting a `bd-###` task, call `file_reservation_paths(...)` for the affected paths; include the issue id in the `reason` and release on completion.

Typical flow (agents)
1) **Pick ready work** (Beads)
   - `bd ready --json` → choose one item (highest priority, no blockers)
2) **Reserve edit surface** (Mail)
   - `file_reservation_paths(project_key, agent_name, ["src/**"], ttl_seconds=3600, exclusive=true, reason="bd-123")`
3) **Announce start** (Mail)
   - `send_message(..., thread_id="bd-123", subject="[bd-123] Start: <short title>", ack_required=true)`
4) **Work and update**
   - Reply in-thread with progress and attach artifacts/images; keep the discussion in one thread per issue id
5) **Complete and release**
   - `bd close bd-123 --reason "Completed"` (Beads is status authority)
   - `release_file_reservations(project_key, agent_name, paths=["src/**"])`
   - Final Mail reply: `[bd-123] Completed` with summary and links

Mapping cheat-sheet
- **Mail `thread_id`** ↔ `bd-###`
- **Mail subject**: `[bd-###] …`
- **File reservation `reason`**: `bd-###`
- **Commit messages (optional)**: include `bd-###` for traceability

Event mirroring (optional automation)
- On `bd update --status blocked`, send a high-importance Mail message in thread `bd-###` describing the blocker.
- On Mail "ACK overdue" for a critical decision, add a Beads label (e.g., `needs-ack`) or bump priority to surface it in `bd ready`.

Pitfalls to avoid
- Don't create or manage tasks in Mail; treat Beads as the single task queue.
- Always include `bd-###` in message `thread_id` to avoid ID drift across tools.


<!-- MCP_AGENT_MAIL_AND_BEADS_SNIPPET_END -->
