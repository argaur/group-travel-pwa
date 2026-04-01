import asyncio
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

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
async def trip_stream(trip_id: str):
    """
    SSE endpoint — yields JSON events for live dashboard updates.
    Events: task_completed | member_joined | vote_cast | expense_added | preference_submitted
    Client (sse.ts) uses EventSource; reconnects on drop with 3s → 10s → 30s backoff.
    """
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
