# Trivo — Build-in-Public Content Outline

Structural outlines only — one LinkedIn post per shipped phase. Each entry gives a working headline, the hook, beat bullets, and the takeaway. Draft copy comes later; this is the skeleton.

---

## Post 1 — The vote bug I found in my own code

- **Headline (working):** "I shipped a group-voting feature. Then I found the bug that would have let one person win every vote."
- **Hook:** The scariest bugs aren't the ones that crash — they're the ones that return a confident, wrong answer. Here's one I caught in my own code before a user ever did.
- **Beats:**
  - Set the scene: group voting is the trust primitive of the whole app — if the tally is wrong, nothing else matters.
  - The bug: what the code *looked* like it did vs. what it actually counted (duplicate/edge-case votes slipping through).
  - How I caught it — not by staring at code, but by testing against real output and seeing a number that couldn't be right.
  - The fix, and the deeper lesson: silent-wrong is worse than loud-broken.
- **Takeaway:** Verify against real output, not a plausible-looking guess. A green screen is not a passing test.

---

## Post 2 — The AI decision: reasoning vs. math (deterministic ÷ LLM)

- **Headline (working):** "The most important AI decision I made was choosing where NOT to use the LLM."
- **Hook:** Everyone's first instinct is to throw the whole problem at the model. The real design work was drawing the line: math the machine, reason the human-shaped part.
- **Beats:**
  - The split rule: deterministic math (budgets, settlements, tallies) stays in code; ambiguous human signal (tone, hidden misalignment) goes to the LLM.
  - **Hero example — the Silent Conflict Surfacer:** deterministic math detects the *gap* in the numbers; the LLM only names and softens the *conflict* underneath.
  - Why this matters: LLMs are bad at arithmetic and great at nuance — using each for the wrong job is where AI products break.
  - The cost/trust dividend: cheaper, auditable, and users trust a number they can reproduce.
- **Takeaway:** Don't ask an LLM to do what a calculator does better. Route by the shape of the problem, not the hype.

---

## Post 3 — The eval harness

- **Headline (working):** "I don't 'vibe-check' my AI features. I built a harness that grades them."
- **Hook:** If you can't measure whether your prompt got better, you're not engineering — you're gambling. So I built the scoreboard first.
- **Beats:**
  - The problem: prompt changes feel better without being better — regression is invisible without a baseline.
  - What the harness does: fixed input cases → model output → scored against expected behavior, run on every change.
  - What it caught that manual testing missed (a "fix" that quietly broke a different case).
  - Treating prompts like code: versioned, tested, and never shipped on a hunch.
- **Takeaway:** An eval harness turns "it feels smarter" into a number you can defend. Build the scoreboard before you optimize.

---

## Post 4 — Before / after of the project

- **Headline (working):** "6 weeks ago this was a PRD. Today it's live in production. Here's the before/after."
- **Hook:** The gap between a plan and a shipped product is where most side projects die. Here's what actually crossed it.
- **Beats:**
  - Before: the pain (silent budget misalignment, organizer burnout, planning scattered across five apps) and the blank repo.
  - After: the shipped surface — auth, trip wizard, anonymous preference synthesis, voting hub, task board, expense settlement, live SSE — running on Next.js 16 + FastAPI.
  - The unglamorous middle: the deploy blocker that pinned prod for a day, and what fixed it.
  - What changed in *me* as a builder between the two snapshots.
- **Takeaway:** Shipping is a skill, not an event. The before/after isn't the features — it's the decisions that survived contact with reality.

---

## Post 5 — Cartographic redesign: derived, not imposed

- **Headline (working):** "I didn't pick a theme for my travel app. I derived one from what the app has to prove."
- **Hook:** Most apps bolt on a generic template and call it design. I threw that out and asked a harder question: what visual language does *group travel specifically* demand?
- **Beats:**
  - The trap: reaching for a stock dashboard theme that could belong to any SaaS — imposed, not inevitable.
  - The derivation: group travel is about routes, distance, and getting a scattered group to one point — so the language became cartographic/expeditionary (maps, contours, plotted paths).
  - The inevitability test: if the design could be transplanted to a fintech dashboard without feeling wrong, it was decoration — this one couldn't.
  - Before/after of the same screen: generic theme vs. derived cartographic system.
- **Takeaway:** Form follows function. Aesthetic is a by-product of understanding what the product must prove — not a skin applied on top.
