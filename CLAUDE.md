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
- Design spec via /frontend-design skill at dev start — no pre-baked aesthetics
- iOS push notifications need PWA installed + iOS 16.4+
- Confirm before Railway redeploys or Vercel production pushes

---

## AI Session Protocol — Read This First

> Instructions for Claude. Follow these steps at the start of every session.

### Step 1: Orient (before touching any code)
- Read this file fully
- Run `git log --oneline -10` to see recent history
- Check "Status" section below → tell Gaurav: current state, what was last done, what's next

### Step 2: Explore → Gemini (not Claude tokens)
- Large file reads, understanding frontend/backend split, reading logs → Gemini terminal tab
- Gemini has 1M context and is free — don't burn Claude tokens on reads
- Paste Gemini's summary into the Claude session as context

### Step 3: Plan → Claude Plan Mode
- Any task with 3+ steps → enter Plan Mode before writing code
- Challenge the ask: right problem? right scope? right time?
- Only build what was asked. Scope Hold.

### Step 4: Build → Split by task type

| Task | Tool |
|---|---|
| Boilerplate, tests, repetitive components/routes, bulk codegen | Codex background mode |
| Auth, Neon DB models, FastAPI endpoints, SSE, edge cases | Claude |
| Inline completions, simple edits | Copilot |

Codex background: `codex exec --prompt "<task>" --full-auto --model gpt-4o-mini > .codex-review.md 2>&1 &`

### Step 5: End of Session (do not skip)
1. Update "Status" section below (current task, blocker, date)
2. Run `/compact` in Claude
3. Update Obsidian: `G:\My Drive\Obsidian Vault\Projects\Group Travel PWA.md`

---

## Status
- **State:** active — V2 live in production (Next.js 16 frontend on Vercel, FastAPI backend on Railway)
- **Current task:** V2 polish — Trivo rebrand follow-on renames + cartographic frontend redesign
- **Blocker:** Apply for Razorpay early (onboarding takes time)
- **Last updated:** 2026-07-23
