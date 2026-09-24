# Research — group-travel-pwa (Trivo)

Source for all version/advisory data below: `npm audit --json` / `npm outdated --json` (frontend, run live against the installed tree, 2026-09-17) and `pip list --outdated --format=json` (backend venv, run live, 2026-09-17) — registry-truth, not memory. GitHub Advisory IDs are cited directly from the audit output. Categories not listed here showed a fit, maintained, current choice in SCAN/UNDERSTAND with no requirement pulling against it — "no change worth researching."

## runtime (frontend: next)
Current: next 16.2.2 (installed, vulnerable range).
Candidates:
- next 16.3.5 | source https://github.com/advisories/GHSA-p293-qw3h-jr36 (+ 15 more advisories in the audit output) | checked 2026-09-17 | status active | caveats: fixes 2 critical unauthenticated RCEs (Windows path-traversal, AVIF image-optimization) plus 9 high/moderate DoS, SSRF, XSS, cache-poisoning and middleware-bypass advisories, all patched by 16.2.5–16.3.3. Already inside the `^16.2.2` semver range — a patch bump, not a migration.
Verdict for DECIDE: upgrade because the installed version sits inside multiple critical-severity CVE ranges and the fix is a same-major bump already permitted by package.json.

## auth (frontend: next-auth / Auth.js v5)
Current: next-auth 5.0.0-beta.30.
Candidates:
- next-auth 5.0.0-beta.32 | source https://github.com/advisories/GHSA-8fpg-xm3f-6cx3 | checked 2026-09-17 | status active (beta channel, this project already deliberately tracks it) | caveats: beta.30 has a critical fail-open bug (config errors can populate the auth object with an error instead of rejecting) plus the `@auth/core` homoglyph email-normalizer bypass. Fixed at beta.32, same channel, no v4 downgrade implied.
Verdict for DECIDE: upgrade because a fail-open auth bug is a correctness/security defect, not a style preference, and the fix stays on the same pre-release track the project already chose.

## css tooling (frontend: postcss)
Current: postcss 8.5.8 installed (package.json allows `^8`, i.e. up to 8.5.28).
Candidates:
- postcss 8.5.28 | source https://github.com/advisories/GHSA-6g55-p6wh-862q, GHSA-r28c-9q8g-f849 | checked 2026-09-17 | status active | caveats: XSS and two rounds of arbitrary-file-read via sourceMappingURL, all fixed within 8.x. Lockfile is simply stale relative to what package.json already permits.
Verdict for DECIDE: upgrade because this is a lockfile refresh (`npm update`), not a version-range change — zero migration cost.

## frontend-framework state (react major)
Current: react/react-dom pinned `^18`, while `@types/react` etc. and Next 16 both support React 19.
Candidates:
- react 19.3.0 | source npm registry (installed peer/types already compatible) | checked 2026-09-17 | status active | caveats: React 19 changes ref-as-prop, removes `propTypes`/legacy context, changes some SSR hydration behavior — a real (if usually small) migration, not a patch. No incident or requirement in this repo currently depends on React 19 features.
Verdict for DECIDE: watch because nothing in the fingerprint requires it yet (no React 19-only API in use, no perf/bug complaint on file) — bundling it into the security-driven `next`/`next-auth` bump would conflate an urgent patch with an optional migration. Do as a separate, deliberate pass.

## styling (Tailwind major)
Current: Tailwind CSS 3.4.19, integrated with the hand-built "Cartography" design system.
Candidates:
- tailwindcss 4.3.3 | source npm registry | checked 2026-09-17 | status active | caveats: v4 changes the config format (CSS-first config, no `tailwind.config.ts` by default) and the PostCSS plugin split into `@tailwindcss/postcss`. Real migration effort against an already-built, CLAUDE.md-protected design system with an explicit "do not reintroduce the old look" non-negotiable.
Verdict for DECIDE: keep because CLAUDE.md already treats the design system as settled and non-negotiable; v4's gains (build speed, smaller CSS) don't offset redoing a hand-tuned config on a system this young. Revisit only if Tailwind v3 stops receiving fixes.

## llm-sdk (backend: anthropic Python SDK)
Current: anthropic 0.116.0 (pre-1.0).
Candidates:
- anthropic 1.6.0 | source PyPI registry (`pip list --outdated`) | checked 2026-09-17 | status active | caveats: this is the SDK's move to a stable 1.x line. The exact call surface this project depends on (`client.messages.create`, `client.messages.parse(..., output_format=PydanticModel)`) is expected to remain, but a major-version bump on the one file that owns every AI call in the product deserves its own PR run through the existing eval suite (`python -m evals.run`) before merge, not folded into a routine dependency sweep.
Verdict for DECIDE: upgrade because pre-1.0 pins carry more drift risk over time and the existing eval harness (`backend/evals/`) already gives a cheap way to catch a breaking change before it reaches production — but flagged for its own verification pass, not a blind bump.

## backend-framework (FastAPI / Starlette)
Current: fastapi 0.115.0 (pulling starlette 0.38.6).
Candidates:
- fastapi 0.141.1 / starlette 1.6.0 | source PyPI registry | checked 2026-09-17 | status active | caveats: 26 minor releases behind; FastAPI's pre-1.0 minors have occasionally carried small breaking changes (dependency-resolution edge cases, OpenAPI schema output). No advisory found against 0.115.0 specifically — this is drift, not a live vulnerability.
Verdict for DECIDE: upgrade because 26 minors of drift on the framework every router in the app depends on is itself a growing risk (harder to bump later, security backports increasingly only land on current minors) — but it's a maintenance-window task, not urgent like the frontend criticals, and should run through the existing pytest suite (`backend/tests/`) before merge.

## auth (backend: python-jose)
Current: python-jose[cryptography] 3.3.0.
Candidates:
- python-jose 3.5.0 | source PyPI registry | checked 2026-09-17 | status active but low release velocity historically | caveats: no advisory found against 3.3.0 in this run.
Verdict for DECIDE: watch because there's no live vulnerability and no requirement driving urgency — a REPLACE (e.g. to PyJWT) needs a `strong_reason` this run has no evidence for. Revisit if an advisory lands or if the project ever needs to touch this code anyway.

## llm-observability / observability (general, both sides)
Current: stdlib `logging` on the backend, PostHog pageviews on the frontend, nothing else on either side.
Candidates:
- Sentry (error tracking, both Python/FastAPI and Next.js SDKs) | source sentry.io docs, already an available MCP tool in this environment | checked 2026-09-17 | status active, house-adjacent (an MCP server for it is already configured) | caveats: adds a dependency and an account, but is a single well-known library, not an architecture change.
Verdict for DECIDE: add because this is now a production system handling auth (and, per the PRD, will handle payments) with zero error visibility beyond manually tailing platform logs — a genuine GAP, not a premature list item (observability isn't on the skill's premature-infrastructure list). Scope narrowly: error tracking only, not a full LLM-observability platform (Langfuse etc.) — nothing in the fingerprint justifies per-prompt tracing yet.

## ai-architecture (agent framework, RAG, vector DB, multi-agent, prompt-management, LLM gateway)
Current: none of these exist in the repo.
Candidates: none proposed.
Verdict for DECIDE: keep-as-is (BUILD, not ADD) because all fourteen AI-architecture questions in constraints.md resolve to "no" with direct evidence from `services/ai.py` and the README's own architecture narrative. This is the one category where the correct research finding is "stop looking" — every premature-infrastructure item the guardrails warn about is genuinely absent for a genuine reason.

## dependency-health tooling / CI gate
Current: no `npm audit` / `pip-audit` gate in CI; this run's findings were invisible to CI.
Candidates:
- `npm audit --audit-level=high` (or `pnpm audit`) as a CI step | source npm CLI, already installed, zero new dependency | checked 2026-09-17 | status active
- `pip-audit` for the backend | source PyPI, actively maintained by PyPA | checked 2026-09-17 | status active
Verdict for DECIDE: add because the CI gap is exactly why 3 critical / 9 high advisories reached a live production app undetected — this is the lowest-cost, highest-leverage recommendation in this run (a CI step, not a new runtime dependency).
