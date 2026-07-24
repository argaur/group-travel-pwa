# Trivo — Group Travel Planning PWA

AI-native group trip coordination Progressive Web App. Solves silent budget misalignment, organizer burnout, and fragmented planning for group travel.

---

## Key File Paths

- **PRD (source of truth):** `C:\Users\Gaurav Gupta\Documents\Professional\Learning\Rethink AI MPM - Cohort 7\Weekday Sessions\Week 7\Group Travel PRD v1.md`
- **Implementation Plan:** `C:\Users\Gaurav Gupta\Documents\Professional\Learning\Rethink AI MPM - Cohort 7\Weekday Sessions\Week 7\Group Travel Implementation Plan.html`
- **Notion:** https://www.notion.so/3342fb7bac3181ddb010e60a279721d1
- **Obsidian:** `G:\My Drive\Obsidian Vault\Projects\Group Travel PWA.md`

---

## Stack

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | Next.js 16 + next-pwa | Vercel |
| Backend | FastAPI (Python) | Railway |
| Database | PostgreSQL / Neon | Neon serverless |
| AI | Claude API (claude-sonnet-4-6) | Anthropic |
| Auth | Auth.js | — |
| Payments | Razorpay (UPI) | — |
| Realtime | FastAPI SSE | Railway (backend) |

---

## Project Structure (planned)

```
group-travel-pwa/
├── frontend/          # Next.js 16 + next-pwa
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── public/
├── backend/           # FastAPI
│   ├── routers/
│   ├── models/
│   ├── services/
│   └── main.py
└── CLAUDE.md / AGENTS.md
```

---

## V1 MVP Scope (6 weeks — P0 only)

1. WhatsApp invite flow (Web Share API)
2. Anonymous preference survey (budget, dietary, trip style)
3. Claude API preference synthesis
4. Group dashboard with SSE live updates
5. Task board with push notifications
6. Basic expense tracking + settlement

## Non-Negotiables

- Apply for Razorpay early — onboarding takes time
- No Supabase (both slots used) — use Neon only
- Design spec via /frontend-design skill at dev start — no pre-baked aesthetics
- iOS push notifications need PWA installed + iOS 16.4+
- Confirm before Railway redeploys or Vercel production pushes

---

## Current State (2026-04-04)

### Live URLs
- **Frontend:** https://frontend-rmrv09xjy-argaurs-projects.vercel.app
- **Backend:** https://group-project-pwa-production.up.railway.app
- **API base:** https://group-project-pwa-production.up.railway.app/api/v1

### Latest Commit
`ab9a390` — Rebrand to Trivo: landing page, icons, and PWA metadata

### Completed (V1 + V2)
- Full auth flow (Google OAuth + Auth.js v5 + backend JWT exchange)
- Trip creation wizard (3-step), preference survey wizard (4-step)
- Anonymous preference collection + Claude AI synthesis
- Group voting hub with AI-generated options
- RSVP + date availability (3-month calendar, heatmap)
- Member roster with real-time SSE activity feed
- Kanban task board with push notifications
- Expense tracking + minimum-transaction settlement
- Day-by-day itinerary builder with comments
- Google Places integration (destination search, hero photos)
- WhatsApp invite flow (Web Share API)
- **Trivo rebrand:** landing page, SVG icons, PWA manifest, OG image

### Design System
- **Fonts:** Fraunces (display/italic) + DM Sans (body) via next/font/google
- **Colors:** `--bg #f6f2ed` · `--ink #0f1222` · `--accent-coral #ff8a6b` · `--accent-pink #ff6b9a` · `--accent-lilac #9a8cff`
- **App aesthetic:** Editorial Expedition — warm parchment, sharp 4px card radius, accent left borders
- **Landing aesthetic:** Expedition Club — dark navy hero, gradient shimmer wordmark, grain overlay

### Known Issues / Blockers
- CORS: `ALLOWED_ORIGINS` on Railway doesn't include latest Vercel deploy URL — fix: update Railway env or add custom domain
- PNG icons (192×512) not yet generated — SVG icon exists at `/icons/trivo-icon.svg`
- Razorpay merchant onboarding pending (blocks payment features)

### Follow-on Renames Needed
- `frontend/components/AppShell.tsx` — still says "GroupTrip" in sidebar
- `frontend/app/auth/signin/page.tsx` — "GroupTrip" in 3 places
- `frontend/app/dashboard/page.tsx` — page title

### Next Priorities
1. Fix CORS by setting custom domain on Vercel or updating Railway `ALLOWED_ORIGINS`
2. Complete AppShell + signin page rename to Trivo
3. Generate PNG icons from SVG (sharp or manual export)
4. Razorpay onboarding → wire up expense settlement payments
5. AI Trip Concierge (V3 feature)
