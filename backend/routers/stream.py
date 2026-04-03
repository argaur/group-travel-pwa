import asyncio
import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user_sse
from database import get_db
from routers.guards import get_trip_membership

router = APIRouter()

# In-memory pub/sub — replace with Redis pub/sub in V2 for multi-instance Railway deploys
_subscribers: dict[str, list[asyncio.Queue]] = {}


async def publish(trip_id: str, event_type: str, data: dict):
    """Publish an event to all SSE subscribers for a trip."""
    if trip_id not in _subscribers:
        return
    message = f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
    for queue in _subscribers[trip_id]:
        await queue.put(message)


async def _event_generator(trip_id: str, queue: asyncio.Queue):
    try:
        while True:
            message = await asyncio.wait_for(queue.get(), timeout=30)
            yield message
    except asyncio.TimeoutError:
        yield ": keepalive\n\n"  # prevent proxy timeouts


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
    trip_uuid = uuid.UUID(trip_id)
    if await get_trip_membership(db, trip_uuid, user.id) is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a trip member")

    queue: asyncio.Queue = asyncio.Queue()
    _subscribers.setdefault(trip_id, []).append(queue)

    async def cleanup():
        _subscribers[trip_id].remove(queue)

    return StreamingResponse(
        _event_generator(trip_id, queue),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable nginx buffering on Railway
        },
    )
