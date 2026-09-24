# Group Travel Planning Platform — PWA

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

## Deploy Targets

**The backend runs on Railway, which estate.md retired on 2026-07-31.** Recorded because it is where
production runs today. It needs a server, so the move is to Vercel or the Oracle VM, and it is open
work under "continue stack migration". Do not add new deployment work on Railway.

> Confirmed production targets — never assume a default (per global Non-Negotiables). **Railway runs the repo-root `railway.toml` `startCommand`** (NOT `backend/Procfile`) — verified via the deploy logs. **CRITICAL (fixed 2026-07-23, commit `73a865f`):** the service **Root Directory is `backend/`**, so the container WORKDIR is already inside `backend/`. The startCommand MUST be `uvicorn main:app --host 0.0.0.0 --port $PORT` with **NO `cd backend`** — an earlier `cd backend` prefix hit `cd: backend: No such file or directory`, so uvicorn never started, `/health` failed, and Railway kept every new deploy unpromoted (prod pinned to an ancient build for a full day). **Migrations are applied OUT-OF-BAND** (`alembic upgrade head` from `backend/` against the shared Neon DB), not in the start command — running them there stalled deploys past the healthcheck window. Railway's `DATABASE_URL` == local `.env` (same Neon db `group_travel`).

**Deploy target:** Railway backend — project `group-project-pwa` (ID `09a1142a-65e0-4763-b456-caa199fc2efa`), env `production`, service `group-project-pwa`, root dir `backend/`, runtime Railpack Python 3.13 (container/node). URL: https://group-project-pwa-production.up.railway.app

**Deploy target:** Vercel frontend — project `frontend` (ID `prj_AcSRrMRk5J8lX86AhnWOT1gXXF0F`), team `argaurs-projects` (`team_3VVVuqz6VHXjBQCANdWIY7OF`), runtime Next.js (node). Primary domain: https://trivo-argaur.vercel.app

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
└── CLAUDE.md
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
- Design system is **"The Cartography of a Trip"** — conform to `frontend/DESIGN_CARTOGRAPHY.md` (expedition-map / field-guide: one vermillion accent, squared ink-on-paper, mono marginalia). Do not reintroduce the old Fraunces/DM Sans pastel look.
- iOS push notifications need PWA installed + iOS 16.4+
- Confirm before Railway redeploys or Vercel production pushes

---

## Project conventions
- Obsidian page for this project: `G:\My Drive\Obsidian Vault\Projects\Group Travel PWA.md`.

---

## Status
- **State:** active — V2 live in production (Next.js 16 frontend on Vercel, FastAPI backend on Railway, removal planned)
- **Current task:** V2 polish — Trivo rebrand follow-on renames + cartographic frontend redesign
- **Blocker:** Apply for Razorpay early (onboarding takes time)
- **Last updated:** 2026-09-24

## Model notes
**This section expires. Review it at every model launch and every Claude Code version bump.**
Current as of 2026-08-05: Opus 5 / Sonnet 5 / Fable 5, Claude Code 2.1.222.
Re-checked 2026-08-07 by `Claude Optimisation/scripts/claude-md-eval.sh`. NOT clean: it reports the
Railway deploy target, retired in estate.md, and this file being over the 200-line guidance.
Both are real and both are open. Do not delete the finding; fix the cause.
- Delegation is not automatic. Claude Code 2.1.219 and later suppress subagents on Opus 5 unless
  the user asks for one, so name the agent when you want it.
- Do not add verification, anti-laziness or hedging instructions. These models self-verify, are
  direct by default, and obey a hedge literally by reporting less.
- Reasoning: `Claude Optimisation/docs/setup-versions/artifacts/2026-08-05-model5-migration/`.
