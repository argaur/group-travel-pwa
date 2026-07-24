# Group Travel PWA — Latest Status

**Last updated:** 2026-04-04  
**Last session:** V2 full build + deploy  
**Git branch:** main @ `a499e5c`

---

## Live URLs

| Service | URL | Status |
|---------|-----|--------|
| Frontend (Vercel) | `https://frontend-rmrv09xjy-argaurs-projects.vercel.app` | Live (latest build) |
| Frontend (stable alias) | `https://frontend-lovat-phi-52.vercel.app` | Live (prior stable) |
| Backend (Railway) | `https://group-project-pwa-production.up.railway.app` | Live |
| API base | `https://group-project-pwa-production.up.railway.app/api/v1` | Live |
| DB | Neon PostgreSQL (pooler, ap-southeast-1) | Live, migrations current |

---

## Infrastructure

| Layer | Tech | Platform | Notes |
|-------|------|----------|-------|
| Frontend | Next.js 16 (App Router) + next-pwa | Vercel | Auto-deploys on push to main |
| Backend | FastAPI + SQLAlchemy async | Railway | Auto-deploys on push to main |
| Database | PostgreSQL (Neon serverless) | Neon | Pooled connection via asyncpg |
| Auth | Auth.js v5 + Google OAuth | — | JWT exchanged for backend token |
| AI | Claude claude-sonnet-4-6 | Anthropic API | Used for preference synthesis, itinerary suggest, vote option generation |
| Places | Google Places API (New) | — | Proxied via FastAPI `/places/*` |

---

## Current Migration State

**Production DB is at head:** `b2c3d4e5f6a7`

Full migration chain:
```
3af7e7feae4d  initial schema
5c1b2f1f3a12  add trip fields, itinerary, push subscriptions
8d9e1fcb2a44  add itinerary comments
a1b2c3d4e5f6  add rsvp_status to trip_members + date_blocks table
b2c3d4e5f6a7  add place columns to trips and itinerary_items  ← HEAD
```

To run migrations on a new environment:
```bash
cd backend && railway run alembic upgrade head
```

---

## What Was Built — V2 (completed 2026-04-04)

### New Backend
| File | What it does |
|------|-------------|
| `backend/routers/rsvp.py` | RSVP status (going/maybe/declined), date blocking, availability heatmap |
| `backend/alembic/versions/a1b2c3d4e5f6_*.py` | RSVP + date_blocks migration |
| `backend/alembic/versions/b2c3d4e5f6a7_*.py` | Place columns on trips + itinerary_items |
| `backend/services/ai.py` | Added `suggest_vote_options()` — generates 4 vote options via Claude |
| `backend/routers/votes.py` | Replaced 501 stub: `POST /trips/{id}/vote-options/ai-generate` |
| `backend/routers/trips.py` | `PUT /trips/{id}/place` endpoint + place fields on TripResponse |
| `backend/routers/itinerary.py` | `PUT /trips/{id}/itinerary/items/{id}/place` endpoint |

### New Frontend Pages
| Route | What it does |
|-------|-------------|
| `/trips/new` | 3-step trip creation wizard (name/type → destination → dates/size) |
| `/trips/[id]/preferences` | 4-step preference survey wizard (budget → dietary → style → constraints) |
| `/trips/[id]/vote` | Group voting hub — VoteCard per topic, CreateVoteForm for organizer |
| `/trips/[id]/rsvp` | RSVP status card + availability link + member grid |
| `/trips/[id]/availability` | Date block picker (3-month calendar) + heatmap |
| `/trips/[id]/members` | Full member roster with filter tabs + RSVP status |
| `/auth/signin` | Split-screen editorial layout (dark left panel with quote) |
| `/dashboard` | Editorial trip grid with photo headers, type accent colors |

### New Frontend Components
| Component | Purpose |
|-----------|---------|
| `components/wizard/WizardShell.tsx` | Full-screen step wizard shell (progress bar, step dots, back/next/submit) |
| `components/wizard/OptionTile.tsx` | Graphical option tile with icon, label, description, radio indicator |
| `components/votes/VoteCard.tsx` | Animated tally progress bars, optimistic vote casting |
| `components/votes/CreateVoteForm.tsx` | Organizer option builder + "AI suggest" button |
| `components/rsvp/RSVPCard.tsx` | 3-button RSVP card with optimistic UI |
| `components/rsvp/MemberRSVPGrid.tsx` | Filter tabs + member rows with RSVP color coding |
| `components/availability/DateBlockPicker.tsx` | Built-from-scratch 3-month calendar, no library |
| `components/availability/AvailabilityHeatmap.tsx` | Conflict-intensity color chips with hover tooltip |
| `components/members/MemberRoster.tsx` | Roster with filter tabs, avatar fallback, transfer leadership |
| `components/places/PlaceSearchInput.tsx` | Debounced Google Places search with keyboard nav |
| `components/places/PlaceCard.tsx` | Hero photo, star ratings, reviews, photo dot nav |
| `components/places/PlacePreviewMini.tsx` | Compact 48px thumbnail + name + rating |

### Design System Applied
- **Fonts:** Fraunces (display, italic) + DM Sans (body) — via `next/font/google`
- **Card radius:** 4px sharp (was 20px rounded)
- **No box-shadow** — border only
- **Accent left-borders** per section type (pink=RSVP, coral=tasks, lilac=votes)
- **CSS variables:** `--font-display`, `--font-body` on all components

---

## Known Issues / Bugs to Fix

> Testing was started but not completed. Specific bugs were noted but not detailed — pick up in next session.

### Confirmed Pre-existing Issues
- **CORS gap:** `ALLOWED_ORIGINS` in Railway env is set to:
  ```
  http://localhost:3000,https://frontend-argaurs-projects.vercel.app,https://frontend-lovat-phi-52.vercel.app
  ```
  The latest Vercel deployment URL (`frontend-rmrv09xjy-argaurs-projects.vercel.app`) is NOT in this list. Requests from the latest build may fail with CORS errors unless you're using one of the whitelisted URLs or a custom domain is set up.
  **Fix:** Add the canonical Vercel domain to `ALLOWED_ORIGINS` in Railway environment variables, or set up a custom domain on Vercel so the URL stays stable.

### TypeScript Build Errors Fixed This Session
- `rsvp_updated` was missing from `SSEEvent` union in `frontend/lib/sse.ts` — fixed
- `event.data` destructure in `rsvp/page.tsx` used `status` instead of `rsvp_status` — fixed

### Likely Issues to Investigate
- **Wizard forms:** `trips/new` and `preferences` pages need end-to-end flow testing
- **Vote page:** CreateVoteForm → publish → VoteCard appearance needs verification
- **RSVP page:** SSE live update path (`rsvp_updated` event → member state update) needs testing
- **Places integration:** `PlaceCard` in dashboard requires `place_id` to be set on trip — verify it persists after `PUT /trips/{id}/place`
- **AI suggest button:** Requires organizer role + preferences submitted gate — verify 403 handling on frontend
- **Date picker:** Calendar renders months starting from current month — verify navigation works

---

## Key Env Vars Reference

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_API_URL` | Vercel | Points to Railway backend |
| `NEXTAUTH_SECRET` | Vercel | Auth.js signing secret |
| `NEXTAUTH_URL` | Vercel | Auth callback base URL |
| `GOOGLE_CLIENT_ID/SECRET` | Vercel | OAuth |
| `DATABASE_URL` | Railway | Neon PostgreSQL (asyncpg format) |
| `JWT_SECRET` | Railway | Backend token signing |
| `ANTHROPIC_API_KEY` | Railway | Claude API |
| `GOOGLE_PLACES_API_KEY` | Railway | Places proxy |
| `ALLOWED_ORIGINS` | Railway | CORS whitelist — **needs update** |

---

## Local Dev Setup

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev   # runs on :3000
```

---

## Repo
`https://github.com/argaur/group-travel-pwa` — main branch  
Railway and Vercel both auto-deploy on push to main.

---

## Next Session Checklist
- [ ] Fix CORS — update `ALLOWED_ORIGINS` in Railway to stable Vercel domain or custom domain
- [ ] Go through reported bugs from testing session
- [ ] Set up custom domain on Vercel (stabilises URL, fixes CORS permanently)
- [ ] Run `alembic upgrade head` check after any new sessions that add migrations
- [ ] Consider adding `NEXT_PUBLIC_APP_URL` env var so invite links generate with the correct base URL
