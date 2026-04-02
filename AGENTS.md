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
| Frontend | Next.js 14 + next-pwa | Vercel |
| Backend | FastAPI (Python) | Railway |
| Database | PostgreSQL / Neon | Neon serverless |
| AI | Codex API (Codex-sonnet-4-6) | Anthropic |
| Auth | Auth.js | — |
| Payments | Razorpay (UPI) | — |
| Realtime | FastAPI SSE | Railway (backend) |

---

## Project Structure (planned)

```
group-travel-pwa/
├── frontend/          # Next.js 14 + next-pwa
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── public/
├── backend/           # FastAPI
│   ├── routers/
│   ├── models/
│   ├── services/
│   └── main.py
└── AGENTS.md
```

---

## V1 MVP Scope (6 weeks — P0 only)

1. WhatsApp invite flow (Web Share API)
2. Anonymous preference survey (budget, dietary, trip style)
3. Codex API preference synthesis
4. Group dashboard with SSE live updates
5. Task board with push notifications
6. Basic expense tracking + settlement

## Non-Negotiables

- Apply for Razorpay early — onboarding takes time
- No Supabase (both slots used) — use Neon only
- Design spec via /frontend-design skill at dev start — no pre-baked aesthetics
- iOS push notifications need PWA installed + iOS 16.4+
- Confirm before Railway redeploys or Vercel production pushes
