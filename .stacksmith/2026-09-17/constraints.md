# Constraints — group-travel-pwa (Trivo)

Age: BROWNFIELD. V2 live in production, two deployed URLs, active user-facing product. Existing conventions win by default; replacement needs a clear, migration-cost-adjusted improvement.

## Load profile
No user/request/volume numbers in any document. This is a solo-founder, early-stage, 11-interview-validated product, not yet at scale (Vercel Hobby plan per estate.md, single Neon serverless DB). Assumption: low tens to low hundreds of concurrent users for the foreseeable future. UNCONFIRMED beyond that — no document states a growth target or a deadline. This caps how aggressively any "scale" argument can justify an ADD.

## DECISION (deliberate technical choices — keep unless replacement is a clear net improvement)
- FastAPI + async SQLAlchemy + asyncpg for the backend. Fits the SSE/realtime and async-DB needs. No pain documented.
- Next.js App Router + next-pwa for an installable PWA with push notifications — directly serves the "no single source of truth / passive members get no signal" problem from the PRD.
- Raw Anthropic SDK, one call-site module (`services/ai.py`), structured output via `messages.parse(output_format=...)` for the flagship feature, deterministic math kept out of the LLM entirely (`aggregate_preferences` is pure Python, unit-tested). This is a genuinely considered architecture (README documents the "why", not just the "what") — a strong signal to leave it alone.
- Hand-built eval harness (`backend/evals/`) wired into CI rather than a third-party eval framework. Proportionate to one AI feature with one grounding rule to test.
- Upstash Redis for SSE pub/sub specifically because Vercel serverless has no shared process state — this is *evidence*, not a guess, that a Vercel backend migration was already anticipated when this was written.
- Tailwind v3 + a from-scratch design system (`DESIGN_CARTOGRAPHY.md`) — deliberate, documented, non-negotiable per CLAUDE.md ("Do not reintroduce the old Fraunces/DM Sans pastel look").

## CONVENTION (house rules — win in brownfield, replacing needs strong_reason)
- estate.md hosting rule: static/private → Cloudflare, needs-a-server → Vercel, must-stay-running-and-Linux → Oracle VM, any database → Neon. Applies here: this is a needs-a-server project, so both frontend and backend belong on Vercel once the Railway retirement is executed. **VM was explicitly ruled out for this project's Railway retirement on 2026-08-19** — do not re-propose it.
- estate.md analytics rule: every deployed project reports anonymous pageviews to PostHog Web Fleet with `posthog.register({project: 'group-travel'})`. Already done (commit `0e39e95`).
- CLAUDE.md quality bar: 44px touch targets, mobile-first, <2s load, dark mode verified as rendered. Not independently re-verified in this pass (out of scope for a stack audit; a UI-skill's job).
- Global CLAUDE.md: "the `anthropic` SDK default client is sync — never `await` it; use `AsyncAnthropic` for async." Current code respects the *spirit* (never awaits the sync client directly) but does it via `asyncio.to_thread` rather than the native async client — works, but is the more roundabout way to get there. Worth a note in DECIDE.

## REQUIREMENT (documented product needs, must be served)
- WhatsApp invite flow, anonymous preference survey, AI preference synthesis, live dashboard (SSE), task board + push notifications, expense tracking/settlement — all V1 P0 scope, all present in the codebase (routers exist for each).
- Razorpay (UPI payments) — "apply early" non-negotiable, onboarding takes time. No Razorpay SDK or integration code found yet (README/CLAUDE.md still list it as a requirement, not yet built). This is a GAP against a REQUIREMENT, not a stack question until integration work starts — flagged, not decided here.
- iOS push needs PWA installed + iOS 16.4+ — already accounted for in the push implementation (out of scope to re-verify push code here).

## FUTURE (documented, not yet built)
- `location_helper` (GPS-aware Claude bot with tool use) and `trip_optimizer` (personalized suggestions) — both explicitly stubbed as "V3 feature — not yet implemented" in `services/ai.py`. This is the first real signal that **tool use** (not a full agent framework) may eventually be justified — but it isn't built, isn't scheduled, and nothing else in the repo depends on it. Premature-list guardrail applies: no ADD today, note it as the trigger to watch for.

## BAGGAGE (a decision whose reason no longer exists)
- CLAUDE.md's own "Deploy Targets" table still asserts Railway is the backend's production home, with a note acknowledging estate.md retired Railway 2026-07-31 and calling this "open work under continue stack migration." The reason for Railway (it was the original deploy target) no longer holds now that Railway is retired org-wide — this is baggage the project's own CLAUDE.md already flags as such. Not this skill's call to execute the migration (that's an infra/deploy decision, not a "which library" decision) — but the **untracked `vercel.json`** at the repo root is material evidence that migration work has already started outside version control. Surfaced in the report as a fact for Gaurav, not resolved by DECIDE.

## ACCIDENTAL (complexity nobody chose)
- None found. No duplicate ORM/logger/HTTP-client/test-runner/state-library. One tool per slot throughout.

## GAP (missing capability a requirement needs)
- No error tracking on either side of a production system that already handles auth and will handle payments. `logger.warning` on an AI-call failure is the only signal an operator gets, and only if they're tailing Railway/Vercel logs. This is a real production system (not a prototype) — proportionate to flag as a genuine gap, not premature.
- No frontend test coverage at all (no runner, no component tests, no e2e) for a PWA with a 3-step trip wizard, 4-step preference wizard, SSE-driven dashboard and push notifications — meaningfully more UI logic than the "trivial, exempt from TDD" bar in the global CLAUDE.md. Backend already has the pattern to mirror (pytest + a CI job); frontend has none.
- Security-critical version drift is a gap against "correct" (top of the CLAUDE.md priority order Correct > Simple > Maintainable > Fast > Elegant): three critical/several high advisories sit inside the frontend's currently-installed range, all fixed by routine patch/minor bumps already compatible with the existing `package.json` ranges (`next`, `next-auth`) or the stale lockfile (`postcss`). No architecture change needed to close this gap.

## AI-era legibility
- Strong: CLAUDE.md + AGENTS.md are detailed and current, deploy targets and IDs are recorded explicitly ("never re-derive"), one file owns all AI calls, typed schemas via Pydantic on both the API and the AI structured-output boundary, CI is deterministic and scriptable (`npm run lint`, `python -m pytest`, `python -m evals.run`).
- Gap: no dependency-health or dead-code tooling wired into CI (no `npm audit`/`pip-audit` gate, no knip) — the 3 critical/9 high advisories found in this run would not have been caught automatically before this audit.

## AI architecture — the fourteen questions (answered from evidence, no research needed: the architecture is simple and fully visible in `services/ai.py` + `README.md`)
1. Single call or multi-step reasoning? Single call per feature (synthesis, destination suggestion, itinerary, vote options, consensus). No chaining, no planning loop.
2. Tool use / function calling? None implemented. `location_helper` is a documented future tool-use candidate (FUTURE, not built).
3. Multi-agent / sub-agent orchestration? No. Nothing in the codebase or documents asks for cooperating agents.
4. Retrieval / RAG over documents? No. No vector store, no document corpus, no embeddings anywhere in the repo.
5. Long-running / async agent workflows? No. Every AI call is a single request/response inside an HTTP handler.
6. Memory across sessions? No. Each call is stateless; persistence is of the *result* (`aggregate_input_hash` keys a cached report), not of conversational memory.
7. Structured output requirement? Yes, and already solved correctly — `client.messages.parse(..., output_format=ConsensusReport)` (Pydantic), with a code-level re-filter as a second guardrail.
8. Streaming to the user? No LLM token streaming; SSE is used for app-state updates, not for streaming model output.
9. Prompt versioning / management need? Prompts are short, inline, single-owner (`ai.py`). No multi-prompt product, no non-engineer prompt editors. No tool need documented.
10. Evaluation need? Yes — already built (`backend/evals/`), proportionate to one flagship feature with one grounding invariant (silent conflicts must cite a real `gap_flag`).
11. Observability into LLM calls specifically (cost, latency, failure rate)? No dedicated tool; folded into the general observability GAP above, not a special AI-only need — one Sentry/logging story covers both.
12. Guardrails / safety filtering beyond the model's own? Yes, and already enforced in code (grounded-conflict filter, anonymity instruction + eval assertion). No third-party guardrail library needed for this scope.
13. Multiple LLM providers / fallback / routing? No. Anthropic only, no gateway, no fallback model. Not documented as a requirement.
14. Agent-to-agent or external agent protocol (MCP, A2A)? No. Not used, not documented as needed.

**Conclusion: this is a textbook "no premature AI infrastructure" codebase.** Every category on the premature list (agent framework, vector DB, multi-agent, workflow engine, prompt-management platform, LLM gateway) has a clean "no" with evidence. RESEARCH should not manufacture ADDs here — the only real work in the `ai` signal area is the SDK major-version bump (0.116 → 1.x) and folding LLM-call visibility into the general observability gap.
