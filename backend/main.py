from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from database import engine
from routers import ai_routes, auth, expenses, itinerary, members, places, preferences, push, rsvp, stream, tasks, trips, votes

settings = get_settings()

if settings.sentry_dsn:
    sentry_sdk.init(dsn=settings.sentry_dsn, send_default_pii=False)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connection pool is initialised lazily by SQLAlchemy on first query
    yield
    # Shutdown: dispose engine to close all pooled connections
    await engine.dispose()


app = FastAPI(
    title="Group Travel API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
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
app.include_router(rsvp.router,        prefix="/api/v1/trips",       tags=["rsvp"])
app.include_router(ai_routes.router,   prefix="/api/v1/ai",          tags=["ai"])
app.include_router(auth.router,        prefix="/api/v1",             tags=["auth"])
app.include_router(push.router,        prefix="/api/v1",             tags=["push"])
app.include_router(places.router,      prefix="/api/v1/places",      tags=["places"])


@app.get("/health")
async def health():
    return {"status": "ok"}
