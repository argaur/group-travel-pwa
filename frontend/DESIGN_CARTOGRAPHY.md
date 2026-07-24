# The Cartography of a Trip — Trivo Design System

Ported from Rethinkly's "Cartography of a Career" (2026-07-08), re-derived for
group travel. This file is the spec the rollout follows when applying the
system to the remaining screens. Reference implementations:

- **Marketing:** `components/LandingPage.tsx` (the showcase)
- **In-app:** `app/dashboard/[tripId]/page.tsx` (copy from this one)
- **CSS source of truth:** `app/globals.css` (everything lives here)
- **Terrain backdrop:** `components/Contours.tsx`

## 1. The premise

Trivo renders a group trip as an **expedition map / field guide**: survey
paper, ink structure, one vermillion route. The product's job — turning eight
scattered opinions into one booked trip — *is* the map's job: orientation,
bearings, a route, an X.

**The governing rule: every graphic carries data. Pure decoration gets cut.**
A contour figure must encode a real divergence; a plate figure must chart real
counts; a coordinate strip must name a real place or a real trip number. If a
visual would survive being transplanted into another product unchanged, it is
decoration — cut it.

## 2. The metaphor mapping

| Motif | Trivo meaning |
|---|---|
| Compass + pulsing "YOU ARE HERE" dot | this trip's current planning stage |
| Self-drawing dashed route | the plan forming: idea → dates → destination → booked |
| Waypoints popping in (`.route-wp`) | decisions locking (dates locked, stay chosen) |
| X-marks-the-spot (`.dest-x`) | the booked trip |
| Coordinate marginalia (`.coords`, `.m-label`) | real destination coords, `TRIP № 04`, `PARTY OF 6`, `FIG. 1 — THE EXPEDITION` |
| Specimen plates (`.plates`/`.plate`) | trip members, candidate destinations, feature instruments, stat readings |
| Ledger + wax stamp (`.ledger`, `.stamp`) | expenses & settlement — "SETTLED · NO IOUs" |
| Topographic contours (`Contours`) | the terrain of the trip |
| **Contours pulling apart** (Surfacer) | **preference gaps** — where budgets/styles diverge, the lines fan out and the gap is hatched |
| Compass-rose wordmark (`TrivoMark`) | the Trivo mark |

### The Silent Conflict Surfacer (AI flagship)

Rendered as **terrain between waypoints** — see `SurfacerTerrain` in the
dashboard. Five contour lines travel from THE PARTY (left, pulsing dot) to the
trip (right, X). Divergence `0..1` is computed from data
(`budget_overlap === null` → 1, else `min(1, gap_flags.length * 0.33)`) and
drives how far the lines fan apart at the right end. The center line is the
vermillion route (`.route-path`, self-drawing) and carries the actual overlap
band ("NAVIGABLE PASS — ₹min–₹max / DAY") or "NO COMMON BUDGET YET". Gap flags
render as hatch strokes in the divergence zone plus `⚑` chips below. Reuse
this exact treatment anywhere preference alignment appears (preferences
summary screen especially).

## 3. Tokens

Defined on `:root` in `app/globals.css`. **Consumed as raw CSS vars** — either
in system classes or as Tailwind arbitrary values (`bg-[var(--paper)]`,
`style={{ color: "var(--ink-60)" }}`). We deliberately did **not** migrate
tokens into `tailwind.config.ts`: the codebase already consumes vars as
arbitrary values in 30+ files, the system classes below do most styling
anyway, and one authority (the CSS file) beats two.

| Token | Value | Job |
|---|---|---|
| `--paper` | `#f2ebdb` | survey ground — page background |
| `--paper-deep` | `#e9dfc8` | banded sections, plate figure fills |
| `--paper-edge` | `#ddd0b2` | pressed edges, hover fills |
| `--ink` | `#1d2531` | ALL structure and type |
| `--ink-60` | `rgba(29,37,49,.62)` | secondary text |
| `--ink-40` | `rgba(29,37,49,.40)` | marginalia, faint labels |
| `--ink-15` | `rgba(29,37,49,.15)` | hairlines, dashed rules, card offset shadow |
| `--ink-08` | `rgba(29,37,49,.08)` | graph-paper grid |
| `--accent` | `#cf3b16` | vermillion — THE single hot accent: route, emphasis, CTA shadow, flags |
| `--accent-deep` | `#a92d0e` | pressed/hover accent |
| `--serif` | Playfair Display | display headlines + italic emphasis |
| `--body` | Source Serif 4 | prose |
| `--mono` | IBM Plex Mono | ALL marginalia/UI chrome — always UPPERCASE, tracking 0.1–0.34em |

`::selection` is vermillion on paper, globally.

**One hot accent.** Nothing else gets color. If something needs a second
emphasis level, it gets weight, size, or ink density — never a new hue.

### Legacy aliases — removed (rollout complete)

The transitional color-var aliases (`--bg`, `--surface`, `--muted`, `--nav`,
`--nav-accent`, `--line`, `--accent-coral/pink/lilac`) have been deleted; every
screen now consumes the primary tokens directly. The one alias that carried a
unique value, `--nav-accent`, was promoted to the real token `--ink-lift`
(active nav rail). The re-derived system classes (`.card`, `.card-interactive`,
`.chip`, `.gradient-text`, `.animate-fade-up`, `.stagger-child`) remain — they
are part of the design system, not aliases. Do not reintroduce the old vars.

## 4. Typography

Loaded in `app/layout.tsx` via `next/font/google` (variables
`--font-display`, `--font-body`, `--font-mono`). Fraunces, DM Sans, and Geist
are gone — do not reintroduce them.

- **Playfair Display** (500/600/700, normal + italic) — headlines only.
  *Italic + vermillion is the signature emphasis* — one word or phrase per
  headline: `<span className="em">group chat</span>` (hero) / `<i>…</i>`
  (`.sec-title`, `.close-h`). Legacy `.gradient-text` now resolves to exactly
  this treatment.
- **Source Serif 4** (400/500/600) — anything read in sentences.
- **IBM Plex Mono** (400/500/700) — all map chrome: labels, coords, buttons,
  badges, table numerics. ALWAYS uppercase, letter-spacing 0.1–0.34em. If text
  is data or chrome, it is mono; if it is prose, it is never mono.

## 5. Structure & shape

- `border-radius: 0` everywhere. Exceptions: `.chip`/`.cart-badge` (999px
  pills) and `.stamp` (6px wax stamp). No other radius, ever.
- Structural borders: `2px solid var(--ink)`. Hairlines:
  `1px dashed var(--ink-15)` (class `.hairline`, or inline `borderTop`).
- Sticker shadow (CTAs): `6px 6px 0 var(--accent)`.
- Card depth: `6px 6px 0 var(--ink-15), 0 24px 48px -16px rgba(29,37,49,.35)`
  (built into `.card`; `.card.flat` for dense stacks where repeated shadows
  would shout).
- Hard-ruled grids: `.plates` — 2px gaps over an ink background, so the grid
  lines are the ink showing through.

## 6. Motif inventory (class names)

| Class | What it is |
|---|---|
| `.cart-wrap` | 1180px content column, clamp padding |
| `body::before` | fixed paper-grain noise overlay (automatic, everywhere) |
| `.cart-field::after` | 72px graph-paper grid, viewport-fixed, **opt-in on a page root**. Landing's hero has its own masked copy (`.hero::after`) — never both |
| `.contours` / `.contours--fixed` | topographic terrain (`<Contours />`, `<Contours fixed />` for scrollable in-app screens) |
| `.m-label` | generic mono marginalia label (`<b>` inside goes vermillion) |
| `.fig-tag` | `FIG. n` figure label with trailing survey rule |
| `.coords` | rotated coordinate strip on a section's right edge (hidden < 1240px) |
| `.sec-head` / `.sec-no` / `.sec-title` / `.sec-rule` | `№ 01` + serif title + rule |
| `.cart-header` / `.hd-inner` / `.wordmark` / `.hd-nav` / `.hd-cta` / `.cart-badge` | marketing header chrome |
| `.hero` / `.hero-grid` / `.hero-fig` / `.em` / `.quiet` / `.cart-sub` | hero block; `.em` underline draws when root has `data-loaded="true"` |
| `.ticker` / `.ticker-track` / `.tick-item` | ink marquee; content via `data-label` attr (aria-hidden, duplicated track for the loop) |
| `.ledger` / `.ledger-col` (`.no`/`.yes`) / `.mk` / `.strike` | two-column evidence table |
| `.stamp` (+ `.inline`) | wax stamp — corner-mounted rotated, or in-flow |
| `.plates-band` | full-bleed `--paper-deep` section band with 2px ink rules |
| `.plates` / `.plate` / `.plate-no` / `.plate-fig` / `.plate-tag` / `.plate-foot` / `.plates-cap` | specimen plate grid. **Gotcha:** the default auto-fit grid exposes ink through unfilled cells — for a known item count add `.even-3` (counts divisible by 6) or `.trio` (exactly 3) so rows always fill |
| `.legend` / `.leg` / `.leg-no` | numbered route bearings (i. ii. iii.) |
| `.close-sec` / `.close-h` / `.close-sub` | ink-ground closing section |
| `.cart-footer` / `.ft` | mono footer |
| `.card` / `.card-interactive` / `.card.flat` | in-app field card |
| `.chip` / `.chip.hot` | pill badge; `.hot` = vermillion flag (`⚑ gap`) |
| `.alert-plate` | the ONLY card with a full vermillion border — warnings/nudges |
| `.skeleton-hatch` | drafting-hatch loading state — **no shimmer, ever** |
| `.field-input` / `.field-select` / `.field-label` | underline form fields (44px min-height) |
| `.cta` (+ `.light`, `.sm`) / `.cta-ghost` / `.cta-note` / `.arrow` | sticker CTA family |

## 7. Motion grammar (CSS-only — no animation libraries)

Keyframes: `compass-spin` (90s linear), `route-draw` (stroke-dashoffset → 0),
`x-pop` (scale 0.4 → 1), `you-pulse` (opacity 1 ↔ .35), `marquee`, `fade-up`,
`slide-in`.

| Class | Behavior |
|---|---|
| `.compass-ring` | 90s spin; `transform-box: fill-box` so it works in any SVG without hardcoded origins |
| `.route-path` | dashed self-draw, 3.2s, 0.7s delay (`stroke-dasharray: 6 8`, offset 600 — paths longer than ~600 units need an inline `strokeDashoffset`/`dasharray` override) |
| `.route-wp` + `.wp-d1`/`.wp-d2` | waypoints pop at 1.7s / 2.6s (after the route reaches them) |
| `.dest-x` | X pops at 3.6s (route arrival) |
| `.you-dot` | 2.4s pulse, infinite |
| `.rv` (+ `.d1`–`.d5`) | scroll-reveal: JS adds `.in` via IntersectionObserver (see `useScrollReveal` in `LandingPage.tsx` — threshold 0.12, unobserve after fire). Above-the-fold hero uses `data-loaded` + immediate `.in` instead |
| `.em::after` | underline draws 1s after `data-loaded="true"` |
| `.cta` | sticker press: hover `-2,-2` / `9px 9px 0`; active `+3,+3` / `2px 2px 0` |
| `.card-interactive` | spring lift `-2,-2` on hover, press on active |
| `.plate:hover` | `-6px` lift + figure tilts `rotate(-4deg) scale(1.08)` with overshoot easing |

**Every one of these is frozen or completed inside the single
`@media (prefers-reduced-motion: reduce)` block in globals.css.** If you add a
keyframe or transition, you MUST add its reduced-motion line in that same
block — routes render fully drawn, X and waypoints visible, reveals visible.

Legacy motion (`.reveal`, `draw-line`, `float`, `shimmer`, `pulse-glow`,
`grain-overlay`, `.gradient-text` shimmer) has been **removed** — do not
re-add. `.animate-fade-up`/`.stagger-child` remain for in-app entrances.

## 8. Layout rules

- Mobile-first. All tap targets ≥ 44px (`.cta`, `.cta-ghost`, `.hd-cta`,
  `.field-*` enforce `min-height: 44px`). No horizontal scroll: the ticker's
  nowrap track must live inside `overflow: hidden` (`.ticker` handles it), and
  page roots that host it need an explicit `width: 100%`.
- `.coords` hides itself < 1240px; `.hd-nav .lnk` hides < 820px;
  `.cart-badge` hides < 560px; `.sec-rule` hides < 640px.
- Section rhythm: `.sec-head` provides top padding; blocks end with
  `margin-bottom: clamp(56px, 8vw, 96px)`.

## 9. Rollout notes (the other 14 screens)

1. **Copy from the dashboard**, not the landing — the landing is marketing
   grammar; in-app screens use `.card`, `.plates` stats, `.m-label` headers,
   `.cta.sm`/`.cta-ghost` actions, dashed-hairline list rows.
2. **Restyle, never refactor.** Data fetching, SSE, auth, props, exported
   component names stay byte-identical. Class/style swaps only.
3. `AppShell` currently harmonizes purely through the legacy aliases (ink
   sidebar, vermillion accents, Playfair wordmark). When it gets its own pass:
   mono-uppercase nav labels, active item = vermillion left rule on
   `--nav-accent`, trip context bar as a coordinate strip.
4. Headings inside cards: Playfair 600 at 20–24px + an `.m-label` counterpart
   on the same row. Never a bare bold sans heading.
5. Numbers are data: render counts/amounts/dates in `--mono` (or Playfair for
   hero-size stats), never body serif.
6. Empty states get map language ("Nothing charted yet"), loading states get
   `.skeleton-hatch` + a mono verb ("PLOTTING THE ROUTE…"), errors get
   `.alert-plate` ("SIGNAL LOST").
7. Expenses/settlement screens must use `.ledger` + `.stamp.inline`
   ("SETTLED · NO IOUs") — that pairing is reserved for money.
8. Preferences summary should reuse `SurfacerTerrain`'s treatment (extract it
   to a shared component at that point — extract-at-3-duplicates rule).
9. Per screen migrated: swap legacy aliases → primary tokens. Last screen:
   delete the alias block from globals.css and §3's alias section here.
10. Watch for old inline `#0f1222` / coral-pink hexes in unmigrated files —
    replace with tokens on contact. Never hardcode hexes in components.
