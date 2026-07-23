# How I designed the AI: the Silent Conflict Surfacer

_A product-and-engineering writeup of the one AI capability in Trivo I chose to make defensible instead of decorative._

---

## The decision behind the feature: surface *silent* conflict, not "plan my trip"

Most travel AI answers the obvious question — _"where should we go?"_ Eleven user interviews said the obvious question isn't where the pain is. The pain is **the conversation nobody has**:

> "People say 'I'm okay with it,' and on the trip they say 'this is getting too costly for me.'"

Budget is the #1 source of group-trip friction and the *least* openly discussed topic. It's not dishonesty — it's a structural design gap. There is no socially safe way to say "I can only do ₹5,000/day" to a group that seems to be assuming ₹15,000. So people proxy budget through Airbnb price picks, and the mismatch detonates mid-trip.

That reframed the AI's job. Not "recommend a destination." Instead: **read the group's anonymous preferences and name the tension they haven't said out loud yet, so the organizer can raise it before anyone books.** I called it the Silent Conflict Surfacer. It's a smaller, sharper capability than "AI trip planner," and that's the point — it maps 1:1 onto the sharpest finding in the research, so the product thesis and the AI feature are the same sentence.

## The core architectural choice: deterministic where possible, LLM for reasoning and language

The failure mode I most wanted to avoid is an "AI" feature that's really a prompt doing arithmetic badly and occasionally hallucinating a conflict to seem useful. So I split the capability in two, along a hard line:

**Deterministic layer (`aggregate_preferences`, pure Python).** Computes budget overlap, spread, per-band distributions, and — critically — the `gap_flags`: `no_budget_overlap` when the ranges don't intersect at all, and `budget_gap` when the spread exceeds 40% of the top of the range. This is trustworthy, cheap, instant, and unit-tested. Numbers should never be a language model's job.

**Reasoning layer (`surface_group_consensus`, Claude).** Consumes the *computed aggregate* — never the raw per-user preferences — and does only what an LLM is actually good at: reasoning about what the numbers imply socially, and saying it warmly and specifically. It returns a typed `ConsensusReport` of `agreement`, `silent_conflicts`, and `directions`.

Why this split is the real talking point:

- **The LLM never does math**, so it can't get the math wrong. The budget gap either exists deterministically or it doesn't.
- **The expensive, non-deterministic, hard-to-test part is as small as possible.** Everything that _can_ be deterministic _is_.
- **It degrades honestly.** If the model call or parse fails, the code raises and the caller falls back to a _labeled_ deterministic summary — never silent canned data pretending to be AI.

## The guardrails, and how they're actually enforced

A prompt that says "don't make things up" is a wish, not a guarantee. Each invariant is enforced in code, not just requested in the system prompt.

**1. Grounded conflicts only.** A silent conflict is valid only if it cites one of the deterministic `gap_flags`. The prompt says so — _and then the code re-filters every returned conflict_, dropping any whose `grounded_in` doesn't intersect the real flags. If there are no flags, `silent_conflicts` is forced empty. This is the anti-hallucination core: the model cannot manufacture tension the math didn't find. A dietary split with aligned budgets produces **zero** silent conflicts, on purpose — the deterministic layer emits no dietary flag, so the surfacer isn't allowed to invent one.

**2. Anonymity is absolute.** The model only ever sees anonymized aggregates — there is no identity in the payload to leak. It's instructed to reason over sub-groups ("the budget-conscious travellers"), never individuals. The anonymity requirement is a first-class product constraint (the whole premise is that people share safely), so it's also a first-class test assertion.

**3. Reliable structured output.** The original code was an f-string plus `json.loads` wrapped in `except: return {"raw": ...}` — parsing could silently fall through and the UI would show canned fallback text forever. The rewrite uses structured outputs (`client.messages.parse` with `output_format=ConsensusReport`), so the response either validates against the Pydantic schema or raises. No silent fallthrough.

**4. Persistence, not per-click regeneration.** The report is stored keyed by `trip_id` + a hash of the aggregate input, so it's generated once and reused — and invalidated automatically when a new preference lands and the hash changes.

## How the evals are structured — making "I evaluate my AI" true

The eval harness (`backend/evals/`) is the part I'd want an AI-PM interviewer to open. It's built around **labeled scenarios**, not vibes.

Each of the 10 scenarios is a small, realistic set of member preferences plus the invariants the surfacer must satisfy for that input:

| Category | Example | Expectation |
|---|---|---|
| Clear consensus | Tight budget band, same style | No silent conflicts |
| Hidden budget split | Backpacker + luxury, no overlap | **Must** flag, grounded in `no_budget_overlap` |
| Wide spread w/ overlap | Ranges overlap but spread > 40% | **Must** flag, grounded in `budget_gap` |
| Dietary conflict, budgets aligned | Vegan + non-veg, same budget | **Must not** flag (no deterministic dietary flag) |
| Too few responses | One response | **Must not** flag (no basis for group tension) |

Crucially, the scenarios are built by running realistic preferences **through the real deterministic aggregator** and asserting it produced the expected `gap_flags` before the surfacer even runs — so the eval exercises the whole pipeline, not a hand-mocked aggregate.

The asserted invariants:

- **Valid structured output** — the result is a well-formed `ConsensusReport`.
- **Grounding** — every silent conflict cites a real deterministic flag.
- **Must-flag / must-not-flag** — per scenario, above.
- **Never-names-an-individual** — the serialized report contains no attribution phrasing.

Two **adversarial** tests are the sharpest: they inject a deliberately misbehaving model output — a conflict grounded in a fabricated flag, and one grounded in nothing — and assert `surface_group_consensus` strips both while keeping the legitimately grounded one. That's the test that proves the guardrail is real code, not a hopeful prompt.

The whole thing runs two ways: a **deterministic stub model in CI** (no API key, free, fast — it locks the guardrail contract on every push) and **`--live` against the real model** on demand for the model-quality dimension. One command: `python -m evals.run`.

## What I'd change with more time, stated honestly

- The deterministic layer only flags **budget** today. Dietary and pace splits are real conflicts the research surfaced, but the surfacer won't ground a conflict on them until the aggregator computes dietary/style gap flags. The eval currently asserts the *anti-hallucination* behavior for those (don't fabricate) — extending real detection is the honest next step.
- There's no explicit minimum-response *decline* message yet; too-few-responses is handled as "don't fabricate conflict" rather than a distinct honest "not enough data" state.
- Live evals are on-demand, not scheduled — an LLM-as-judge rubric for narrative quality would make the model-quality dimension continuous.

## Why this is the right first AI, and what comes after

The Surfacer is deliberately narrow: one capability, deterministic core, evaluated LLM, enforced guardrails. It proves a discipline. The *next* phase of the AI — an agentic **Trip Coordinator** with tools (Places search, budget math, availability) that drafts plans and answers organizer questions — is far higher scope and risk. Sequencing it after the eval harness exists is the whole bet: I don't ship the agent until I can measure it the same way I measure this.

---

_Related: the [README](../README.md) for the architecture, and the [PRD](../Reference%20Files/Group%20Travel%20PRD%20v1.md) for the research and product thesis this AI encodes._
