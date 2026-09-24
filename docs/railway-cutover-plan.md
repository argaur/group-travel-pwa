# Railway cutover plan

Goal: remove Railway from this project completely. Backend moves to a second Vercel project. No paid service added. Written 2026-09-24.

## Verified limits (Vercel docs, fetched 2026-09-24)

| Limit | Value | Effect here |
|---|---|---|
| Function max duration, Hobby | 300s default and maximum | Every SSE stream is killed at 5 min |
| Python bundle | 500 MB uncompressed | Fine |
| Concurrency | auto-scales to 30,000 | Fine |
| Request/response body | 4.5 MB | Fine, no uploads |
| Memory | 2 GB, 1 vCPU | Fine |
| FastAPI entrypoint | `main.py` with `app` is auto-detected, also under `app/` or `src/` | `backend/main.py` works as is |
| Upstash Redis free | 500K commands/month, 256 MB, 10 GB bandwidth | See SSE cost below |

Vercel Hobby is for personal, non-commercial use. Razorpay payments (PRD) make this commercial, so plan to move to Pro before charging anyone. Not needed while there are no users.

## Decisions

1. **Separate Vercel project `trivo-api`**, Root Directory `backend/`, zero-config FastAPI. No rewrite through the frontend: a proxy would count double against the 300s stream limit.
2. **Delete root `vercel.json`.** It uses legacy `builds`, which overrides project settings, and it only makes sense if one project deploys both apps.
3. **Keep Upstash Redis on the free tier.** $0, already coded. A zero-service alternative exists (Neon polling) but keeps Neon compute awake per open stream. Revisit only if the free tier is hit.
4. **Domain:** `trivo-api.gauravg.dev` (Cloudflare DNS CNAME to Vercel), per the estate rule.

## Two code changes the 300s limit forces

Today `stream.py` starts each connection from "now" and `sse.ts` reconnects after a 3s backoff. On Vercel every stream dies every 5 minutes, so events published in that gap are lost.

- `stream.py`: emit `id: <redis entry id>` on every event, accept `?last_id=`, and end the stream cleanly at about 280s.
- `sse.ts`: remember the last event id and send it as `last_id` on reconnect; drop the 3s first backoff to about 500ms when the close was clean.
- `stream.py`: raise `_POLL_INTERVAL_SECONDS` from 1.5 to 3. Cost: 1.5s means about 2,400 Redis commands per client-hour (roughly 200 client-hours per month on free tier); 3s doubles that headroom.

Write a failing test first for the reconnect gap, per the TDD rule.

## Cutover steps

Nothing here runs without a go-ahead. Steps 1 to 3 are safe; step 5 is a production push.

1. **Code prep (branch `railway-removal`):** delete root `vercel.json`, `railway.toml`, `backend/Procfile`. Apply the two changes above with tests.
2. **Create Vercel project `trivo-api`** from the same GitHub repo, Root Directory `backend/`. Region: match the Neon region (check the Neon dashboard; Vercel default is `iad1`).
3. **Set env vars on `trivo-api`** (values from Railway, never pasted in chat): `DATABASE_URL` (Neon pooled host), `ANTHROPIC_API_KEY`, `SECRET_KEY`, `NEXTAUTH_SECRET` (must equal the frontend's `AUTH_SECRET`), `ALLOWED_ORIGINS`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `VAPID_*`, `SENTRY_DSN`, and the Razorpay and Maps keys if set. Deploy a preview and hit `/health`.
4. **Smoke test the preview:** `/health`, sign in, create a trip, open the dashboard stream, wait past 300s, confirm reconnect loses no events.
5. **Attach `trivo-api.gauravg.dev`**, set `NEXT_PUBLIC_API_URL=https://trivo-api.gauravg.dev/api/v1` on the `frontend` project, redeploy the frontend to production (confirm first).
6. **Verify in production:** Google sign-in, trip create, live SSE update between two browsers.
7. **Retire Railway:** delete project `group-project-pwa` (`09a1142a-65e0-4763-b456-caa199fc2efa`) and confirm the billing page shows no active service. Do this only after step 6 passes.
8. **Docs:** remove Railway from `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `README.md`; update the Deploy Targets block to `trivo-api`; add `trivo-api.gauravg.dev` to the backend CORS default and drop the stale Railway URL.

## Rollback

Steps 1 to 6 leave Railway running. If step 6 fails, set `NEXT_PUBLIC_API_URL` back to the Railway URL and redeploy the frontend. Railway is deleted only in step 7.

## Risks

- Cold starts on Python plus SQLAlchemy: expect 1 to 3s on the first request after idle. Acceptable with no users.
- Migrations stay out-of-band (`alembic upgrade head` from `backend/` against Neon). Unchanged.
- `?token=` JWT in the SSE URL appears in Vercel request logs. Existing behavior, not new; note for later.
