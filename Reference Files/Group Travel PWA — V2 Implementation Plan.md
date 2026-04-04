# Group Travel PWA — V2 Implementation Plan

**Date:** 2026-04-04  
**Status:** ✅ FULLY EXECUTED — all 8 sprints complete  
**Baseline:** V1 (6 sprints) shipped. Gap analysis run against all files in repo on 2026-04-04. Full V2 execution completed same day.

---

## Execution Summary

| Sprint | Focus | Status |
|--------|-------|--------|
| Sprint 0 | Bug fixes (async wrapper, DEMO_DECISIONS) | ✅ Complete |
| Sprint 1 | Voting UI — VoteCard, CreateVoteForm, vote page | ✅ Complete |
| Sprint 2 | AppShell + Typography (Fraunces + DM Sans) | ✅ Complete |
| Sprint 3 | RSVP system — DB migration, backend router, frontend pages | ✅ Complete |
| Sprint 4 | Google Places — DB columns, PUT endpoints, place components, itinerary integration | ✅ Complete |
| Sprint 5 | Member roster — MemberRoster component + /members page | ✅ Complete |
| Sprint 6 | Wizard forms — WizardShell, OptionTile, trip creation wizard, preference survey wizard | ✅ Complete |
| Sprint 7 | Visual redesign — signin split-screen editorial, dashboard trip grid | ✅ Complete |
| Sprint 8 | AI vote option generation — backend endpoint + frontend AI suggest button | ✅ Complete |

---

## Gap Analysis Summary

Full audit of `/backend` and `/frontend` against the original PRD and V1 plan.

### What Was Already Built ✅ (V1 baseline)

**Backend routers (all mounted in main.py):**
- `auth.py` — POST /api/v1/auth/token (Google → JWT exchange)
- `trips.py` — CRUD + `dashboard-summary` aggregate endpoint
- `members.py` — invite (HMAC token), join, list, transfer-organizer
- `preferences.py` — submit, summary, ai-synthesis (with 60% threshold gate)
- `tasks.py` — full CRUD + SSE broadcast on status change
- `expenses.py` — add expense, list, settlement algorithm
- `votes.py` — cast_vote, get_vote_tally (basic)
- `stream.py` — SSE with in-memory pub/sub + keepalive
- `itinerary.py` — day/item CRUD + AI suggest + comments
- `push.py` — subscribe/unsubscribe push endpoint
- `places.py` — Google Places proxy fully implemented (search + details, with sample fallback)

**Backend models (all in db.py):**
- User, Trip, TripMember, Preference, Task, Expense, ExpenseSplit, Vote, VoteResponse, ItineraryItem (with `sub_group`, `cost_estimate`, `start_time`, `end_time`), ItineraryComment, PushSubscription
- Trip has: `trip_type`, `group_size_estimate`
- Preference has: `constraints` array, `notes` free-text, `is_anonymous` flag

---

### Gaps Identified and Resolved

| ID | Gap | Sprint | Resolution |
|----|-----|--------|-----------|
| G1 | Voting UI — backend live, zero frontend | Sprint 1 | VoteCard + CreateVoteForm + vote hub page |
| G2 | RSVP system — no DB columns, no router, no frontend | Sprint 3 | Alembic migration + rsvp.py router + RSVPCard + MemberRSVPGrid + RSVP page + availability pages |
| G3 | Place columns missing on Trip + ItineraryItem | Sprint 4 | Alembic migration b2c3d4e5f6a7 + PUT /trips/{id}/place + PUT /itinerary/items/{id}/place |
| G4 | No reusable place components | Sprint 4 | PlaceSearchInput, PlaceCard, PlacePreviewMini |
| G5 | No WizardShell + OptionTile | Sprint 6 | Created both components |
| G6 | Preference survey was 4 bare inputs | Sprint 6 | 4-step graphical wizard (budget presets → dietary → style → constraints) |
| G7 | Trip creation was single-screen basic form | Sprint 6 | 3-step wizard (name/type → destination → dates/size) |
| G8 | No /members page | Sprint 5 | MemberRoster + /trips/[tripId]/members page |
| G9 | No date availability picker | Sprint 3 | DateBlockPicker (built-from-scratch calendar) + AvailabilityHeatmap |
| G10 | AI vote generation was 501 stub | Sprint 8 | suggest_vote_options() in ai.py + organizer endpoint + "AI suggest" button |
| G11 | synthesize_preferences blocking event loop | Sprint 0 | Wrapped all 3 Claude calls in asyncio.to_thread() |
| G13 | Dashboard showed hardcoded DEMO_DECISIONS | Sprint 0/1 | Replaced with real vote tally fetching via Promise.allSettled |
| G14 | Dashboard inline place fetching (no component) | Sprint 4 | Extracted to PlaceCard component; dashboard uses <PlaceCard placeId={placeId} /> |
| G15 | AppShell missing RSVP + Members nav items | Sprint 2 | Added vote, members, rsvp to active type + nav list |

---

## Design System — "Editorial Expedition"

### Concept
Trip planning is anticipation. The UI feels like a high-end travel magazine: bold hierarchy, photo-forward, editorial. Condé Nast Traveler × Linear density.

### Color Palette (preserved from V1, unchanged)
```css
--bg: #f6f2ed;           /* warm off-white */
--surface: #ffffff;
--ink: #0f1222;
--muted: #7a7f8b;
--nav: #171b2b;
--nav-accent: #262b3f;
--line: rgba(15,18,34,0.08);
--accent-pink: #ff6b9a;
--accent-coral: #ff8a6b;
--accent-lilac: #9a8cff;
```

### Typography
- **Display font:** Fraunces (serif, variable — supports italic, weight 300/500/700)
- **Body font:** DM Sans (sans-serif, weight 300/400/500/600)
- Loaded via `next/font/google` in `layout.tsx`, exposed as `--font-display` and `--font-body` CSS variables
- Page titles: Fraunces 300 italic, 36–42px
- Section headers: Fraunces 500, 18–28px
- Body/labels: DM Sans 400, 13–15px
- Metadata/chips: DM Sans 300, 11–12px, letter-spacing 0.04em

### Card Language
- `border-radius: 4px` — sharp, editorial (down from 20px rounded)
- `border-left: 3px solid <section-color>` per section type
  - Members/RSVP → `--accent-pink`
  - Tasks → `--accent-coral`
  - Votes/Decisions → `--accent-lilac`
  - Itinerary/Places → `--accent-pink`
- No `box-shadow`. Use `border: 1px solid var(--line)` only.
- Hover: `.card-interactive` — left-border thickens to 4px, subtle bg shift

### Form Wizards
- Full-screen step wizards (WizardShell component)
- 3px progress line at top (lilac fill, animates across steps)
- Step dots row shows completed / current / pending
- Large OptionTile cards replace bare checkboxes/dropdowns
- Back + primary CTA buttons at bottom

---

## Sprint 0 — Bug Fixes ✅

### Bug Fix: synthesize_preferences async wrapper
**File:** `backend/services/ai.py`

All three functions (`synthesize_preferences`, `suggest_destinations`, `suggest_itinerary`) now use:
```python
message = await asyncio.to_thread(
    client.messages.create,
    model=MODEL,
    max_tokens=...,
    messages=[{"role": "user", "content": prompt}],
)
```
`import asyncio` added at top. Anthropic SDK remains synchronous (`anthropic.Anthropic()`).

### Bug Fix: DEMO_DECISIONS wired to real votes
**File:** `frontend/app/dashboard/[tripId]/page.tsx`

- Removed `DEMO_DECISIONS` constant
- Added `VOTE_TOPICS` array (destination, dates, accommodation)
- `voteTallies` state fetched via `Promise.allSettled` in `load()` callback
- Dashboard decisions card renders real tally: vote count, leading option, "Open voting →" link
- SSE `vote_cast` event triggers tally reload

---

## Sprint 1 — Voting UI ✅

### Files Created/Modified

| File | Change |
|------|--------|
| `frontend/components/votes/VoteCard.tsx` | New — animated progress bars, optimistic UI, accent-lilac left border |
| `frontend/components/votes/CreateVoteForm.tsx` | New — option chips, min 2 to publish, AI suggest button (Sprint 8) |
| `frontend/app/trips/[tripId]/vote/page.tsx` | New — TripPlanningGate, 3 vote topics, SSE live, member participation progress |
| `frontend/components/AppShell.tsx` | Added "Decisions" nav item → `/trips/${tripId}/vote` |

### Key Design Decisions
- VoteCard: Each option has a proportional progress bar (CSS transition from 0→actual via double requestAnimationFrame on mount)
- Organizer sees CreateVoteForm below each topic; members see empty state until options exist
- Member participation bar shows X/total voted across all topics

---

## Sprint 2 — AppShell + Typography Redesign ✅

### Files Modified

| File | Change |
|------|--------|
| `frontend/app/layout.tsx` | Added Fraunces + DM Sans via next/font/google; CSS variables injected on body |
| `frontend/app/globals.css` | Card radius 20px → 4px; box-shadow removed; card-accent-* classes added; slide-in animation; stagger-child delays |
| `frontend/components/AppShell.tsx` | "GroupTrip" text in Fraunces italic; active item = left 3px lilac border + nav-accent bg; vote/members/rsvp nav items; sign-out at sidebar bottom |

---

## Sprint 3 — RSVP System ✅

### Backend

**New migration:** `backend/alembic/versions/a1b2c3d4e5f6_add_rsvp_date_blocks.py`
- `rsvp_status VARCHAR(20) NOT NULL DEFAULT 'pending'` on `trip_members`
- `rsvp_updated_at TIMESTAMPTZ` nullable on `trip_members`
- New `date_blocks` table: `(trip_id, user_id, blocked_date)` with unique constraint

**Updated:** `backend/models/db.py`
- TripMember: `rsvp_status`, `rsvp_updated_at`
- New `DateBlock` ORM model
- Trip + ItineraryItem: place columns (see Sprint 4)

**New router:** `backend/routers/rsvp.py`
- `PUT /{trip_id}/rsvp` — update my RSVP status (going/maybe/declined); broadcasts SSE `rsvp_updated`
- `GET /{trip_id}/rsvp` — list all members with RSVP data
- `POST /{trip_id}/availability` — full-replace my date blocks
- `GET /{trip_id}/availability` — heatmap with blocked_by names, my_blocks, total_members

**Updated:** `backend/main.py`
- `app.include_router(rsvp.router, prefix="/api/v1/trips", tags=["rsvp"])`

### Frontend

| File | Purpose |
|------|---------|
| `frontend/components/rsvp/RSVPCard.tsx` | Invitation card with 3 status buttons (Going/Maybe/Can't make it), optimistic UI, toast |
| `frontend/components/rsvp/MemberRSVPGrid.tsx` | Summary chips + filter tabs + member rows with RSVP left-border + survey badges |
| `frontend/components/availability/DateBlockPicker.tsx` | 3-month calendar (no library), coral blocked dates, save button |
| `frontend/components/availability/AvailabilityHeatmap.tsx` | Date chips colored by conflict intensity, hover tooltip with names |
| `frontend/app/trips/[tripId]/rsvp/page.tsx` | RSVPCard + availability link + MemberRSVPGrid; SSE individual member updates |
| `frontend/app/trips/[tripId]/availability/page.tsx` | 2-column layout: DateBlockPicker (left) + AvailabilityHeatmap (right) |

---

## Sprint 4 — Google Places Integration ✅

### Backend

**New migration:** `backend/alembic/versions/b2c3d4e5f6a7_add_place_columns.py`
- `place_id`, `place_name`, `place_photo_url`, `place_rating` on both `trips` and `itinerary_items`

**Updated:** `backend/models/db.py`
- Trip: 4 place columns
- ItineraryItem: 4 place columns

**Updated:** `backend/routers/trips.py`
- `PlaceUpdate` Pydantic model
- `TripResponse` extended with optional place fields
- `PUT /{trip_id}/place` endpoint (organizer only)

**Updated:** `backend/routers/itinerary.py`
- `ItemPlaceUpdate` Pydantic model
- `PUT /{trip_id}/itinerary/items/{item_id}/place` endpoint (organizer only)

### Frontend

| File | Purpose |
|------|---------|
| `frontend/components/places/PlaceSearchInput.tsx` | Debounced 300ms search, keyboard nav, loading spinner, outside-click close |
| `frontend/components/places/PlaceCard.tsx` | Hero photo with dot nav, star ratings, Fraunces italic reviews, sample badge, dismiss button |
| `frontend/components/places/PlacePreviewMini.tsx` | 48px thumbnail + name + star rating + hover overlay |
| `frontend/app/trips/new/page.tsx` | Integrated PlaceSearchInput + PlaceCard with onDismiss |
| `frontend/app/dashboard/[tripId]/page.tsx` | Replaced inline place fetch with `<PlaceCard placeId={placeId} />` |
| `frontend/app/trips/[tripId]/itinerary/page.tsx` | PlaceSearchInput on add form + inline "Add/Change place" picker per item + PlacePreviewMini display |

---

## Sprint 5 — Member Roster ✅

### Files Created

| File | Purpose |
|------|---------|
| `frontend/components/members/MemberRoster.tsx` | Filter tabs (All/Going/Pending/Survey done), summary chips, RSVP left-border color, deterministic avatar color, transfer leadership |
| `frontend/app/trips/[tripId]/members/page.tsx` | Merges member + RSVP data, SSE live updates on member_joined / rsvp_updated / preference_submitted / leader_transferred |

### Key Design Decisions
- RSVP left-border: Going → accent-pink, Maybe → accent-coral, Declined/Pending → muted/line
- Avatar: `hsl()` deterministic color from name hash when no avatar_url
- Transfer leadership: select dropdown + confirm button; calls existing `transfer-organizer` endpoint

---

## Sprint 6 — Wizard Forms ✅

### New Shared Components

**`frontend/components/wizard/WizardShell.tsx`**
- Props: steps[], currentStep, title, subtitle, onBack, onNext, onSubmit, labels, disabled, loading
- 3px progress bar at top (lilac fill, transition 500ms)
- Step dots row (completed=lilac, current=ink, pending=line)
- Fraunces italic step titles; DM Sans subtitles
- Back + primary CTA at bottom

**`frontend/components/wizard/OptionTile.tsx`**
- Props: label, description, icon (emoji), selected, onClick, accentColor, disabled
- Radio-style selection with accent border + tinted bg
- Custom colored radio dot indicator

### Rewritten Pages

**`frontend/app/trips/new/page.tsx`** — 3-step wizard:
1. **Name & type** — text input + 6 TRIP_TYPES as OptionTile grid (icon + label + description)
2. **Destination** — PlaceSearchInput + PlaceCard (dismissible); optional skip
3. **Dates & size** — date range pickers + group size number input

**`frontend/app/trips/[tripId]/preferences/page.tsx`** — 4-step wizard:
1. **Budget** — 4 preset tiles (Budget/Mid-range/Comfort/Luxury) + custom min/max inputs
2. **Dietary** — 6 OptionTile options (No restriction, Veg, Non-veg, Vegan, Jain, Halal); "no restriction" clears others
3. **Travel style** — 5 OptionTile options (Relaxed, Adventure, Cultural, Party, Mixed)
4. **Constraints & notes** — 4 accessibility/preference tiles + free-text textarea

---

## Sprint 7 — Visual Redesign ✅

### `frontend/app/auth/signin/page.tsx` — Split-screen editorial

**Left panel (dark, `lg:flex`, hidden on mobile):**
- `background: var(--ink)`
- Subtle 45° diagonal grid texture overlay (CSS repeating-linear-gradient, 3% opacity)
- "GroupTrip" in Fraunces italic 300 22px (white)
- Random editorial quote in Fraunces italic 300 28px (white)
- Accent color bar trio (coral + lilac + pink) at bottom

**Right panel:**
- "Plan together. / Travel better." in Fraunces italic 300 32px
- 3-bullet value prop
- `h-12` rounded-[4px] button with inline Google SVG logo (white opacity layered)
- Fine print on anonymity

### `frontend/app/dashboard/page.tsx` — Editorial trip grid

- Top bar: "GroupTrip" logo left, "Sign out" right
- Welcome header: "Welcome back, {firstName}." in Fraunces italic 300 42px
- "Plan new trip" button aligned right on same row
- Trip cards: `sm:grid-cols-2` grid
  - 112px photo header — uses `place_photo_url` if set, else gradient using trip-type accent color
  - Accent color dot overlay (top-left corner)
  - Status pill (top-right, frosted glass)
  - Trip name (DM Sans 500 15px)
  - Destination + date range formatted as "15 Apr – 20 Apr"
  - Trip type in accent color uppercase 11px
- Skeleton loader animation while fetching
- Empty state with dashed border, Fraunces italic "No trips yet."

---

## Sprint 8 — AI Vote Option Generation ✅

### Backend

**`backend/services/ai.py`** — New function `suggest_vote_options(vote_type, context)`
- Generates 4 specific, actionable options for destination / dates / accommodation votes
- Sends group preference context to Claude (claude-sonnet-4-6)
- Returns `list[{id, label, description}]`
- Strips markdown code blocks from response before JSON parse
- Fallback: returns single option with raw text if JSON parse fails

**`backend/routers/votes.py`** — Replaced 501 stub
- `POST /{trip_id}/vote-options/ai-generate`
- Organizer-only (403 if not organizer)
- Calls `suggest_vote_options()`; surfaces Claude errors as 502

### Frontend

**`frontend/components/votes/CreateVoteForm.tsx`** — "AI suggest" button
- Props extended: `preferenceSummary?: Record<string, unknown>`
- "AI suggest" button (accent-lilac outline pill) calls the endpoint
- Populates options state from response; replaces any existing options
- Error state: "AI suggestion failed. Add options manually."

---

## Migrations Required on Production Neon DB

Two new Alembic migrations must be run against the Railway-deployed backend:

```bash
# SSH into Railway shell or run via Railway CLI
cd backend
alembic upgrade head
```

**Migration a1b2c3d4e5f6** — RSVP + date blocks:
- `ALTER TABLE trip_members ADD COLUMN rsvp_status VARCHAR(20) NOT NULL DEFAULT 'pending'`
- `ALTER TABLE trip_members ADD COLUMN rsvp_updated_at TIMESTAMPTZ`
- `CREATE TABLE date_blocks (...)`

**Migration b2c3d4e5f6a7** — Place columns:
- `ALTER TABLE trips ADD COLUMN place_id TEXT, place_name TEXT, place_photo_url TEXT, place_rating NUMERIC(3,1)`
- `ALTER TABLE itinerary_items ADD COLUMN place_id TEXT, place_name TEXT, place_photo_url TEXT, place_rating NUMERIC(3,1)`

---

## Architecture Notes

### SSE Events (full list after V2)
| Event | Triggered by | Consumers |
|-------|-------------|-----------|
| `preference_submitted` | preferences.py | dashboard, vote page |
| `member_joined` | members.py | dashboard, members page |
| `leader_transferred` | members.py | dashboard, members page |
| `vote_cast` | votes.py | dashboard, vote page |
| `task_updated` | tasks.py | tasks page |
| `rsvp_updated` | rsvp.py | rsvp page, members page |

### Page → Backend Dependency Map
```
/trips/new             → POST /trips, PUT /trips/{id}/place, POST /trips/{id}/invite
/trips/{id}/join       → GET /trips/{id}/invite, POST /trips/{id}/members/join
/trips/{id}/preferences → POST /trips/{id}/preferences
/trips/{id}/vote       → GET/POST /trips/{id}/votes/{type}, POST /vote-options/ai-generate
/trips/{id}/rsvp       → PUT/GET /trips/{id}/rsvp
/trips/{id}/availability → POST/GET /trips/{id}/availability
/trips/{id]/members    → GET /trips/{id}/members + /rsvp, POST transfer-organizer
/dashboard/{id}        → GET dashboard-summary, members, votes/{type}
/trips/{id}/itinerary  → CRUD /itinerary, PUT items/{id}/place, POST ai-suggest
```

---

*Plan last updated: 2026-04-04 — all sprints executed.*
