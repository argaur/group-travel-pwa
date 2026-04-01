from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import trips, members, preferences, tasks, itinerary, expenses, votes, ai_routes, stream


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialise DB connection pool here (Neon/asyncpg)
    yield
    # Shutdown: close pool


app = FastAPI(
    title="Group Travel API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-vercel-domain.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(trips.router,       prefix="/api/v1/trips",       tags=["trips"])
app.include_router(members.router,     prefix="/api/v1/trips",       tags=["members"])
app.include_router(preferences.router, prefix="/api/v1/trips",       tags=["preferences"])
app.include_router(tasks.router,       prefix="/api/v1/trips",       tags=["tasks"])
app.include_router(itinerary.router,   prefix="/api/v1/trips",       tags=["itinerary"])
app.include_router(expenses.router,    prefix="/api/v1/trips",       tags=["expenses"])
app.include_router(votes.router,       prefix="/api/v1/trips",       tags=["votes"])
app.include_router(stream.router,      prefix="/api/v1/trips",       tags=["realtime"])
app.include_router(ai_routes.router,   prefix="/api/v1/ai",          tags=["ai"])


@app.get("/health")
async def health():
    return {"status": "ok"}
