# Fingerprint — group-travel-pwa (Trivo)

## Languages, runtimes
- TypeScript (frontend), Python 3.13 (backend, per CI). No `.nvmrc`/`mise.toml`/`engines` pin for Node — CI pins node-version 20 but nothing local enforces it.
- No root-level monorepo tool. Two independent apps (`frontend/`, `backend/`) in one repo, each with its own manifest. Not a monorepo (no workspaces, no turbo/nx).

## Package managers / lockfiles
- Frontend: npm (`package-lock.json`).
- Backend: pip, pinned exact versions in `requirements.txt` / `requirements-dev.txt`. No lockfile hash pinning (no `pip-compile`/`uv.lock`), but pins are exact `==`.

## Repository layout
- `frontend/` — Next.js 16 App Router PWA.
- `backend/` — FastAPI, routers/services/models split, Alembic migrations, `evals/` for AI eval harness.
- No shared package between them (API contract is informal, via `lib/api.ts` on the frontend).

## Frontend
- Next.js `^16.2.2` (App Router, `next dev/build --webpack` — Turbopack not used), React `^18` / `react-dom ^18`.
- next-auth `5.0.0-beta.30` (Auth.js v5 beta) + Google OAuth, backend JWT exchange (`lib/backend-auth.ts`).
- `@ducanh2912/next-pwa ^10.2.6` for the PWA/service worker.
- Styling: Tailwind CSS `^3.4.1` (v3, not v4), custom design system (`DESIGN_CARTOGRAPHY.md`).
- State: no state library found (no Redux/Zustand/Jotai) — plain React state/context, consistent with app size.
- No forms library found (no react-hook-form/formik) — wizard components under `components/wizard/`.
- Bundler: Next's own webpack pipeline (`--webpack` flag forces webpack over the newer default).

## Backend
- FastAPI `0.115.0`, Uvicorn `0.30.6`, Pydantic `2.9.2` / `pydantic-settings 2.5.2`.
- API style: REST, routers per domain (trips, votes, rsvp, expenses, tasks, push, stream, preferences, ai_routes).
- Validation: Pydantic schemas (`models/schemas.py`).
- SSE for realtime (`routers/stream.py`), backed by Upstash Redis pub/sub (`upstash-redis 1.2.0`) — chosen specifically because "Vercel serverless has no shared process state" (comment in requirements.txt), i.e. already anticipating the Vercel migration.
- Auth: `python-jose[cryptography]` for JWT, `passlib[bcrypt]` for hashing.
- Migrations: Alembic, applied out-of-band (not in the deploy start command — documented root cause of an earlier outage).

## Data
- PostgreSQL via Neon (serverless), SQLAlchemy 2.0 async ORM (`asyncpg` driver).
- No caching layer, no search, no vector DB. None found or required by any document.

## Async
- No queue/worker system. Redis used only for SSE pub/sub (Upstash), not as a general queue.

## AI
- Raw `anthropic` Python SDK `0.116.0` (pre-1.0), sync client (`anthropic.Anthropic`) called through `asyncio.to_thread` — not `AsyncAnthropic`, but never awaited directly either, so it doesn't hit the sync-client footgun.
- One file owns every model call: `backend/services/ai.py`.
- Structured output via `client.messages.parse(..., output_format=PydanticModel)` for the flagship feature (Silent Conflict Surfacer); plain `.create()` + manual `json.loads` elsewhere with a raw-text fallback.
- No agent framework, no tool use, no multi-step/multi-agent orchestration, no RAG/vector store, no prompt-management tool (prompts are inline f-strings), no LLM observability tool (Langfuse/Helicone/etc — none), no dedicated eval framework — evals are hand-built (`backend/evals/`: harness, fakes, scenarios) and wired into CI (`python -m evals.run`).
- Two V3 stubs (`location_helper`, `trip_optimizer`) raise `NotImplementedError` — documented future tool-use requirement, not built yet.
- Model ids hardcoded as strings (`claude-sonnet-4-6`, `claude-opus-4-8`) — a model-choice/product concern, out of stacksmith's scope, flagged for Gaurav separately in the report, not as a stack recommendation.

## Integrations and external services
- Anthropic (Claude API), Google OAuth, Razorpay (planned, not yet integrated in code found), Upstash Redis, Neon Postgres, Web Push (`pywebpush`) for notifications.

## Auth
- Google OAuth via Auth.js v5 (frontend) → backend JWT exchange → `python-jose` verification (backend). Secrets via `.env` / platform env vars.

## Observability
- Backend: stdlib `logging` only (`logger.warning` on AI-call failure, swallowed to a fallback). No error tracking, no metrics, no tracing.
- Frontend: PostHog Web Fleet analytics wired in (`public/analytics.js`, commit `0e39e95`), anonymous pageviews only, per the house convention in estate.md.
- No error-tracking service (Sentry etc.) on either side despite a production system handling auth and (planned) payments.

## Testing
- Backend: pytest + pytest-asyncio, unit tests (`backend/tests/`) + a custom AI eval suite (`backend/evals/`), both run in CI.
- Frontend: **no test runner** — `package.json` has no jest/vitest/playwright/testing-library. CI only lints + typechecks the frontend. No e2e, no visual regression.

## Quality
- Frontend: ESLint 9 (`eslint-config-next`), TypeScript strict via `tsc --noEmit` in CI. No Prettier/Biome found, no dead-code tool (knip), no dependency-cruiser.
- Backend: no linter/formatter found (no ruff/black/flake8 config).

## CI/CD
- GitHub Actions (`.github/workflows/ci.yml`): frontend job (lint + typecheck), backend job (pytest + evals). No deploy step in CI — deploys are manual (`vercel deploy`, Railway git-push deploy).
- No infra-as-code, no containers/Dockerfile, no Kubernetes.

## Developer tooling / agent legibility
- CLAUDE.md + AGENTS.md present and detailed (deploy targets, non-negotiables, stack table). Good agent legibility.
- No MCP server config found in-repo. No project-level `.claude/` skills.

## Documents found
- `CLAUDE.md`, `AGENTS.md`, `README.md`, `frontend/DESIGN_CARTOGRAPHY.md`, `Reference Files/Group Travel PRD v1.md`, `Reference Files/Group Travel Implementation Plan.html`, `Reference Files/Group Travel - Cloud Provisioning.md`, `Reference Files/some suggested changes.md`, `Reference Files/linear-fluttering-balloon.md` (untracked, not yet reviewed in depth — none contradicted anything above on skim).

## Deploy target — in flux (important context, not this skill's decision to make)
- CLAUDE.md still names Railway as the backend's production deploy target, but estate.md retired Railway on 2026-07-31 and ruled the Oracle VM out for this project on 2026-08-19. An **untracked** `vercel.json` (git status: `?? vercel.json`) has just appeared at the repo root, using the legacy `builds`/`routes` config format, defining a *second* Vercel deployment that serves both `frontend/` and `backend/main.py` (`@vercel/python`) from one project — distinct from the already-live, separately deployed `frontend` Vercel project. This looks like an in-progress attempt at the Railway→Vercel migration referenced in estate.md's "continue stack migration" backlog. Flagged in the report as a fact to resolve with Gaurav before RESEARCH treats "backend platform" as settled — not silently decided by this run.

## Dependency health
- **Frontend `npm audit`: 20 advisories (3 critical, 9 high, 6 moderate, 2 low).** The two critical direct-dependency ones are the load-bearing findings:
  - `next` 16.2.2 has multiple advisories fixed by 16.2.5–16.2.11, including two **critical unauthenticated RCEs** (GHSA-p293-qw3h-jr36 Windows path traversal RCE, GHSA-2xp9-vwfh-vxw4 AVIF image-optimization RCE), both fixed by 16.3.3+. Installed range is fully inside the vulnerable range.
  - `next-auth` 5.0.0-beta.30 has a **critical auth-fail-open bug** (GHSA-8fpg-xm3f-6cx3: config errors can populate the auth object with an error state instead of failing closed) plus the `@auth/core` email-normalizer homoglyph bypass — both fixed at beta.32.
  - `postcss` installed is 8.5.8 despite `package.json` allowing `^8` (which resolves to 8.5.28) — the lockfile is simply stale; `npm update` clears most of the moderate/high/low findings (babel, browserslist, js-yaml, nanoid, sharp, workbox chain) as transitive fallout of bumping `next`/`postcss`.
  - `npm outdated`: react/react-dom pinned to `^18` while Next 16 and its own types (`@types/react` etc.) are already compatible with React 19 — an intentional-looking hold, not drift, but worth a decision either way.
- **Backend `pip list --outdated`: every pinned package is behind**, most by minors, three stand out:
  - `anthropic` 0.116.0 → 1.6.0 is a **major version** (the SDK went to a stable 1.x). `client.messages.parse` / `output_format` usage should be re-verified against the 1.x migration notes before bumping.
  - `fastapi` 0.115.0 → 0.141.1 (26 minors behind, pre-1.0 so each minor can carry breaking changes); `starlette`, its transitive pin, jumped from 0.38 to a stable 1.x line.
  - `pydantic` 2.9.2 → 2.13.5 (same major, low risk).
  - `python-jose` 3.3.0 → 3.5.0 — no CVE found against the installed version specifically, but the project has had low upstream maintenance velocity historically; noted as WATCH, not REPLACE (no incident, no requirement drives a change today).

## Age
BROWNFIELD — V2 live in production per CLAUDE.md status block, git history of 5+ recent commits, two separately deployed live URLs.

## Signals (for Phase 0 re-run)
ai, frontend, backend, stale-deps, house-stack, no-observability
(no-tests applies to the frontend only, not the whole repo — backend has real tests + evals; not asserting the repo-wide signal)
