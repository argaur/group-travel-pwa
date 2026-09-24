# Stacksmith report: group-travel-pwa / Trivo (AUDIT, BROWNFIELD)
No changes have been made. Approval is required before Phase 7.

## Project fingerprint
AI-native group-trip coordination PWA, V2 live in production (two deployed URLs, solo-founder, early-stage — no volume numbers documented, assume low tens to low hundreds of users). Next.js 16 App Router + next-pwa frontend on Vercel; FastAPI + async SQLAlchemy backend, deployed on Railway today though estate.md retired Railway and CLAUDE.md itself flags the deploy target as stale ("continue stack migration"). Neon Postgres, Upstash Redis for SSE pub/sub. AI: raw Anthropic SDK, one call-site file, structured output for the flagship "Silent Conflict Surfacer" feature, deterministic math kept fully separate from the LLM. Backend has real tests + a custom eval harness in CI; frontend has none. Signals: ai, frontend, backend, stale-deps, house-stack, no-observability.

## Current stack
- Frontend: Next.js 16.2.2, React 18, next-auth 5 beta (Auth.js), Tailwind 3, next-pwa, no state/forms library (plain React).
- Backend: FastAPI 0.115, SQLAlchemy 2.0 async + asyncpg, Alembic, python-jose + passlib, Upstash Redis (SSE only), Anthropic SDK 0.116 (pre-1.0).
- AI: single-call-per-feature, structured output via `messages.parse`, no agent framework/RAG/vector DB/prompt-management tool/LLM-gateway — none needed (see the 14 AI-architecture questions in `constraints.md`, all evidenced "no").
- Testing/CI: backend pytest + evals in GitHub Actions; frontend lint + typecheck only, no test runner.
- Observability: stdlib logging (backend) + PostHog pageviews (frontend); no error tracking on either side.
- Deploy: Vercel (frontend, live) + Railway (backend, live but org-retired); an **untracked `vercel.json`** at the repo root suggests a Vercel backend migration is already in progress outside version control — flagged below, not resolved by this audit.

## Recommendations
| Area | Current | Recommendation | Decision | Install scope | Why | Cost impact | Performance impact | Risk | Confidence |
|---|---|---|---|---|---|---|---|---|---|
| r1 Next.js | 16.2.2 | 16.3.5 (npm update, same range) | UPGRADE | RUNTIME_DEPENDENCY | Installed version is inside 2 critical RCE + 9 high/moderate advisory ranges; fix is a patch bump | none | none | low | high |
| r2 next-auth | 5.0.0-beta.30 | 5.0.0-beta.32 | UPGRADE | RUNTIME_DEPENDENCY | Critical fail-open auth bug + homoglyph bypass, fixed same beta channel | none | none | low | high |
| r3 postcss | 8.5.8 installed | 8.5.28 (already allowed by `^8`) | UPGRADE | RUNTIME_DEPENDENCY | Stale lockfile inside XSS/file-read advisory ranges; zero-cost refresh, also clears several transitive findings | none | none | low | high |
| r6 anthropic SDK | 0.116.0 | 1.6.0 | UPGRADE | RUNTIME_DEPENDENCY | Pre-1.0 SDK now stable at 1.x; single file owns every AI call — bump through the eval suite before merge | none | unverified until evals run | medium | medium |
| r7 FastAPI/Starlette | 0.115.0 / 0.38.6 | 0.141.1 / 1.6.0 | UPGRADE | RUNTIME_DEPENDENCY | 26 minors of drift on the framework every router depends on; no live CVE, maintenance-window task | none | neutral/positive | low | medium |
| r9 Error tracking | none | Sentry (FastAPI + Next.js SDKs) | ADD | RUNTIME_DEPENDENCY | Production auth (+planned payments) system with zero error visibility beyond tailing logs | Sentry free/team tier | negligible | low | high |
| r10 Dependency-audit CI gate | none | `npm audit --audit-level=high` + `pip-audit` in CI | ADD | CI | This run's findings would have been invisible to CI otherwise; lowest-cost, highest-leverage item here | CI minutes only | seconds added | low | high |
| r12 Frontend tests | none | Vitest + React Testing Library | ADD | DEV_DEPENDENCY | Wizard/dashboard/push UI has meaningfully more logic than the "trivial" TDD-exempt bar, with zero coverage today | none | adds to CI time only | low | medium |

## Do not change
- Raw Anthropic SDK, single-call architecture, no agent framework: considered LangChain/LangGraph for the V3 tool-use stub; staying because that feature isn't built or scheduled, and three functions plus a future tool call will suffice when it is. (r11)
- Tailwind CSS v3: considered Tailwind v4; staying because CLAUDE.md treats the hand-built design system as settled and non-negotiable, and v4's config-format migration isn't offset by gains this project's scale doesn't need. (r5)
- FastAPI + async SQLAlchemy, Next.js + next-pwa, Upstash Redis for SSE, the hand-built eval harness — all fit, documented, no pain found.
- **WATCH** — React 19: types already compatible, but nothing requires it; don't bundle an optional major into the urgent security bumps above. (r4)
- **WATCH** — python-jose: no advisory against the installed version; no `strong_reason` for a REPLACE today. (r8)

## Architecture changes
None. Every recommendation is a version bump, a CI step, or a new dev-dependency for tests — no ADD touches the premature-infrastructure list (cache, queue, vector DB, workflow engine, agent framework, microservices, k8s), and the AI architecture itself is confirmed already minimal and correctly scoped.

## Installation plan
1. r3 — `cd frontend && npm update postcss` (or a full `npm update` to also clear transitive babel/browserslist/js-yaml/nanoid/sharp/workbox findings). Verify: `npm audit` shows those entries gone.
2. r1 — `cd frontend && npm install next@16.3.5`. Verify: `npm run build`, `npm run lint`, manual smoke of auth + trip flows (per the global CLAUDE.md's "test the golden path in a browser" rule for UI changes).
3. r2 — `cd frontend && npm install next-auth@5.0.0-beta.32`. Verify: Google OAuth sign-in flow end-to-end, `npm audit` shows the @auth/core advisories gone.
4. r7 — `cd backend && pip install -U fastapi starlette` (pin exact versions in requirements.txt as the project already does). Verify: `pytest -ra`.
5. r6 — `cd backend && pip install -U anthropic`, then run `python -m evals.run` before touching requirements.txt permanently — any eval regression blocks the bump until `services/ai.py`'s call sites are adjusted.
6. r10 — add an `npm audit --audit-level=high` step to the frontend CI job and a `pip-audit` step to the backend CI job in `.github/workflows/ci.yml`.
7. r9 — add `sentry-sdk[fastapi]` to `backend/requirements.txt` and `@sentry/nextjs` to `frontend/package.json`; wire DSNs via existing env-var conventions (`.env.example` files already show the pattern). Verify: trigger a test error in each, confirm it lands in Sentry.
8. r12 — add `vitest`, `@testing-library/react`, `@testing-library/jest-dom` as dev dependencies; add a `test` script and a CI step; start with the trip wizard and preference wizard as the first coverage targets (highest logic density, zero coverage today).

## Expected result
- Closes 3 critical + 9 high security advisories currently live in the deployed frontend dependency tree — measured (from `npm audit` on the installed tree today).
- Removes the single largest blind spot in production operations (no error tracking on a system with auth + planned payments) — inferred from the absence found in this scan, not from an incident report.
- Prevents this exact gap from recurring silently — measured mechanism (a CI gate), inferred effect (depends on the team acting on future audit failures).
- Starts closing the frontend's test-coverage gap without adding process weight the project doesn't already have on the backend — inferred; no baseline defect rate exists to measure against.
- No change to runtime cost, deployment topology, or the AI architecture — the audit's dominant finding is "close a security gap that already exists," not "add capability."

## Uncertainty
- **anthropic 0.116.0 -> 1.6.0 (r6)** is a major version; the exact call-surface compatibility of `messages.parse`/`output_format` was not independently verified against the 1.x changelog in this pass — the recommendation is UPGRADE with a mandatory eval-suite gate, not a blind bump. Confidence: medium.
- **fastapi/starlette (r7)**: 26 minors of drift with no specific advisory found; risk is accumulated drift, not a known vulnerability. Confidence: medium.
- **The untracked `vercel.json` and Railway/Vercel migration status** is UNCONFIRMED as a finished decision — it's real evidence a migration is in progress outside git, but resolving it is a deploy-target decision for Gaurav, not something this audit decided. Not represented as a recommendation.
- **Load profile** (users, request volume, growth) has no documented number anywhere — every score above assumes "small, early-stage" scale; if that's wrong, several WATCH/KEEP calls (react 19, tailwind v4) could flip.

Approve all, approve by id (for example "approve r1, r9, r10"), or tell me what to change.
