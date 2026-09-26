# Gemini CLI Context
> Keep this updated so Gemini can pick up where Claude left off.

## Project
Trivo — AI-native group travel planning PWA. Solves budget misalignment, organizer burnout, and no single source of truth for group trips.

## Stack
Next.js 16 App Router · TypeScript · Tailwind CSS · Auth.js v5 (Google OAuth) · FastAPI (Python) · PostgreSQL/Neon · Claude API (claude-sonnet-4-6) · Vercel `trivo-api` (backend) · Vercel (frontend) · next-pwa · SSE (real-time)

## Current Task
None active. Last session completed Trivo rebrand + landing page (2026-04-04).

## Completed
- V1: Auth, trip creation, anonymous preference survey, Claude AI synthesis, dashboard with SSE, task board, expense tracking + settlement, WhatsApp invite
- V2: Voting hub, RSVP + availability, member roster, Google Places, wizard forms, AI vote generation, visual redesign
- **Trivo rebrand:** Product renamed from GroupTrip → Trivo; landing page built (8 sections), SVG app icon + OG image, PWA manifest updated

## Next Steps
1. Cutover Step 7: retire Railway (see `docs/railway-cutover-plan.md`)
2. Rename remaining "GroupTrip" references: `AppShell.tsx`, `auth/signin/page.tsx`, `dashboard/page.tsx`
3. Generate PNG icons (192×512) from `/public/icons/trivo-icon.svg` using sharp
4. Razorpay merchant onboarding → wire expense settlement payments
5. AI Trip Concierge (V3)

## Key Files
- `frontend/app/page.tsx` — landing page entry (server auth check → renders LandingPage)
- `frontend/components/LandingPage.tsx` — full marketing landing page ("use client", 8 sections)
- `frontend/components/AppShell.tsx` — app sidebar/nav (still says GroupTrip — needs rename)
- `frontend/app/globals.css` — CSS vars + "Cartography of a Trip" design system (contours, specimen plates, ledger, route-draw, scroll-reveal); see `frontend/DESIGN_CARTOGRAPHY.md`
- `frontend/app/layout.tsx` — fonts (Playfair Display + Source Serif 4 + IBM Plex Mono), metadata, viewport
- `frontend/public/manifest.json` — PWA manifest (name: Trivo, theme: #ff8a6b coral)
- `frontend/public/icons/trivo-icon.svg` — app icon SVG (T-as-route-marker)
- `backend/main.py` — FastAPI app entry
- `backend/routers/` — 10 routers: trips, preferences, votes, rsvp, availability, tasks, expenses, members, itinerary, places
- `backend/alembic/` — migrations (HEAD: b2c3d4e5f6a7 — place columns)

## Decisions
- Neon (not Supabase) for PostgreSQL — both Supabase slots used on other projects
- Auth.js v5 with JWT exchange to backend — keeps frontend/backend auth separate
- SSE (not WebSockets) for real-time — simpler hosting (resumable over Upstash Redis Streams on Vercel), sufficient for use case
- Claude sync client wrapped in asyncio — avoids library mismatch with async FastAPI
- Fraunces italic for all display type — editorial travel-magazine aesthetic
- Dark navy (#0f1222) for hero/dark sections, warm parchment (#f6f2ed) for app background

## Blockers / Notes
- **CORS:** resolved. `BUILTIN_ORIGINS` in `backend/config.py` covers known frontend hosts
- **PNG icons missing:** Manifest references icon-192.png and icon-512.png — files don't exist yet, SVG fallback works but Android PWA install may warn
- **Razorpay:** Merchant account onboarding in progress — blocks Sprint 6 (payments)
- **iOS push:** Requires PWA installed to home screen + iOS 16.4+
- Live frontend: https://frontend-rmrv09xjy-argaurs-projects.vercel.app
- Live backend: https://trivo-api.gauravg.dev
