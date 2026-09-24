"""Per-trip SSE event bus.

Two backends behind one interface:
- MemoryBus: in-process queues. Correct on a single long-lived process (Railway, local dev).
- RedisBus: Upstash Redis Streams. Needed on serverless hosts, where instances share no memory.

Redis is used only when both Upstash settings are present. Publishing never breaks the request
that triggered it: a bus failure is logged and the write still succeeds.
"""
import asyncio
import json
import logging
import time
from typing import AsyncIterator, Optional, Protocol

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

KEEPALIVE_SECONDS = 30.0


def _format(event_type: str, data: dict) -> str:
    return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"


class Bus(Protocol):
    async def publish(self, trip_id: str, event_type: str, data: dict) -> None: ...
    def subscribe(
        self,
        trip_id: str,
        keepalive_seconds: float = ...,
        last_id: Optional[str] = ...,
        max_seconds: Optional[float] = ...,
    ) -> AsyncIterator[str]: ...


class MemoryBus:
    def __init__(self) -> None:
        self._subscribers: dict[str, list[asyncio.Queue]] = {}

    async def publish(self, trip_id: str, event_type: str, data: dict) -> None:
        message = _format(event_type, data)
        for queue in list(self._subscribers.get(trip_id, ())):
            queue.put_nowait(message)

    def subscribe(
        self,
        trip_id: str,
        keepalive_seconds: float = KEEPALIVE_SECONDS,
        last_id: Optional[str] = None,  # no event ids in memory: nothing to replay
        max_seconds: Optional[float] = None,  # long-lived hosts have no stream time limit
    ) -> AsyncIterator[str]:
        # Register now, not on first iteration, so no event published before the
        # response starts streaming is missed.
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers.setdefault(trip_id, []).append(queue)
        return self._drain(trip_id, queue, keepalive_seconds)

    async def _drain(self, trip_id: str, queue: asyncio.Queue, keepalive_seconds: float) -> AsyncIterator[str]:
        try:
            while True:
                try:
                    yield await asyncio.wait_for(queue.get(), timeout=keepalive_seconds)
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"  # keep proxies from closing an idle stream
        finally:
            subs = self._subscribers.get(trip_id)
            if subs and queue in subs:
                subs.remove(queue)
                if not subs:
                    self._subscribers.pop(trip_id, None)


class RedisBus:
    """Redis Stream per trip. Upstash's REST API has no blocking SUBSCRIBE, so readers short-poll XRANGE."""

    _STREAM_TTL_SECONDS = 6 * 60 * 60
    _STREAM_MAXLEN = 200
    _POLL_INTERVAL_SECONDS = 3.0

    def __init__(self, url: str, token: str) -> None:
        from upstash_redis.asyncio import Redis  # imported lazily: only needed when configured

        self._redis = Redis(url=url, token=token)

    @staticmethod
    def _key(trip_id: str) -> str:
        return f"trip:{trip_id}:events"

    async def publish(self, trip_id: str, event_type: str, data: dict) -> None:
        key = self._key(trip_id)
        await self._redis.xadd(
            key, "*", {"event": event_type, "data": json.dumps(data)},
            maxlen=self._STREAM_MAXLEN, approximate=True,
        )
        await self._redis.expire(key, self._STREAM_TTL_SECONDS)

    def subscribe(
        self,
        trip_id: str,
        keepalive_seconds: float = KEEPALIVE_SECONDS,
        last_id: Optional[str] = None,
        max_seconds: Optional[float] = None,
    ) -> AsyncIterator[str]:
        return self._poll(trip_id, last_id, max_seconds)

    async def _poll(self, trip_id: str, last_id: Optional[str], max_seconds: Optional[float]) -> AsyncIterator[str]:
        """Stream events after last_id (or from now). Ends cleanly at max_seconds so a host with a
        function time limit closes the stream itself; the client resumes with the last id it saw."""
        key = self._key(trip_id)
        if last_id is None:
            latest = await self._redis.xrevrange(key, "+", "-", count=1)
            last_id = latest[0][0] if latest else "0"
        deadline = None if max_seconds is None else time.monotonic() + max_seconds
        while deadline is None or time.monotonic() < deadline:
            entries = await self._redis.xrange(key, f"({last_id}", "+")
            if entries:
                for entry_id, fields in entries:
                    last_id = entry_id
                    yield f"id: {entry_id}\nevent: {fields['event']}\ndata: {fields['data']}\n\n"
            else:
                yield ": keepalive\n\n"
            await asyncio.sleep(self._POLL_INTERVAL_SECONDS)


_bus: Optional[Bus] = None


def get_bus() -> Bus:
    global _bus
    if _bus is None:
        if settings.upstash_redis_rest_url and settings.upstash_redis_rest_token:
            _bus = RedisBus(settings.upstash_redis_rest_url, settings.upstash_redis_rest_token)
        else:
            _bus = MemoryBus()
    return _bus


async def publish(trip_id: str, event_type: str, data: dict) -> None:
    """Publish a trip event. Failures are logged, never raised: realtime is best-effort."""
    try:
        await get_bus().publish(trip_id, event_type, data)
    except Exception:
        logger.exception("realtime publish failed: trip=%s event=%s", trip_id, event_type)
