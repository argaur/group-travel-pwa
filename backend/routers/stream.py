import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from upstash_redis.asyncio import Redis

from auth import get_current_user_sse
from config import get_settings
from database import get_db
from routers.guards import get_trip_membership, parse_uuid

router = APIRouter()
settings = get_settings()

# Redis Stream pub/sub — replaces the old in-memory asyncio.Queue dict, which
# only worked because Railway ran one long-lived process. Vercel functions
# are stateless and can spin up multiple isolated instances per request, so
# in-process subscriber state can't be shared across invocations.
#
# Upstash's REST API has no blocking SUBSCRIBE, so this uses a Redis Stream
# per trip (XADD on publish) with the reader short-polling XRANGE — the
# standard workaround for pub/sub against a REST-only Redis. Each stream key
# gets a TTL refreshed on every publish so idle trips don't accumulate keys
# forever.
_STREAM_TTL_SECONDS = 6 * 60 * 60  # 6 hours — comfortably longer than a live planning session
_STREAM_MAXLEN = 200  # approximate trim; a burst of catch-up history is fine, unbounded growth isn't
_POLL_INTERVAL_SECONDS = 1.5

_redis = Redis(url=settings.upstash_redis_rest_url, token=settings.upstash_redis_rest_token)


def _stream_key(trip_id: str) -> str:
    return f"trip:{trip_id}:events"


async def publish(trip_id: str, event_type: str, data: dict):
    """Publish an event for a trip's SSE subscribers."""
    key = _stream_key(trip_id)
    await _redis.xadd(
        key,
        "*",
        {"event": event_type, "data": json.dumps(data)},
        maxlen=_STREAM_MAXLEN,
        approximate=True,
    )
    await _redis.expire(key, _STREAM_TTL_SECONDS)


async def _event_generator(trip_id: str):
    key = _stream_key(trip_id)
    # Start from "now" — XREVRANGE for the latest entry ID so a newly
    # connected client doesn't replay a trip's entire history, matching the
    # old queue's "only future events" behaviour.
    latest = await _redis.xrevrange(key, "+", "-", count=1)
    last_id = latest[0][0] if latest else "0"

    try:
        while True:
            entries = await _redis.xrange(key, f"({last_id}", "+")
            if entries:
                for entry_id, fields in entries:
                    last_id = entry_id
                    yield f"event: {fields['event']}\ndata: {fields['data']}\n\n"
            else:
                yield ": keepalive\n\n"  # prevent proxy timeouts, keep the stream open
            await asyncio.sleep(_POLL_INTERVAL_SECONDS)
    except asyncio.CancelledError:
        # Client disconnected — nothing to clean up, state lives in Redis
        # with its own TTL, not in this process.
        raise


@router.get("/{trip_id}/stream")
async def trip_stream(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user_sse),
):
    """
    SSE endpoint — yields JSON events for live dashboard updates.
    Events: task_completed | member_joined | vote_cast | expense_added | preference_submitted | leader_transferred
    Auth: Authorization Bearer or ?token= (required for browser EventSource).
    """
    trip_uuid = parse_uuid(trip_id, "trip_id")
    if await get_trip_membership(db, trip_uuid, user.id) is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a trip member")

    return StreamingResponse(
        _event_generator(trip_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable proxy buffering (Vercel/edge, formerly Railway's nginx)
        },
    )
