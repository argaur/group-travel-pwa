"""Realtime bus: works with no Redis configured, and never breaks the write that publishes."""
import asyncio
import logging

import pytest

from services import realtime


async def test_memory_bus_delivers_to_subscriber():
    bus = realtime.MemoryBus()
    stream = bus.subscribe("trip-1")
    await bus.publish("trip-1", "vote_cast", {"n": 1})
    assert await asyncio.wait_for(stream.__anext__(), 1) == 'event: vote_cast\ndata: {"n": 1}\n\n'
    await stream.aclose()


async def test_memory_bus_isolates_trips():
    bus = realtime.MemoryBus()
    stream = bus.subscribe("trip-a", keepalive_seconds=0.05)
    await bus.publish("trip-b", "vote_cast", {})
    assert await asyncio.wait_for(stream.__anext__(), 1) == ": keepalive\n\n"
    await stream.aclose()


async def test_memory_bus_unsubscribes_on_close():
    bus = realtime.MemoryBus()
    stream = bus.subscribe("trip-1", keepalive_seconds=0.05)
    await stream.__anext__()
    await stream.aclose()
    assert "trip-1" not in bus._subscribers


async def test_publish_with_no_subscribers_is_a_noop():
    await realtime.MemoryBus().publish("nobody", "vote_cast", {})


async def test_publish_swallows_and_logs_backend_failure(monkeypatch, caplog):
    class Broken:
        async def publish(self, *a, **k):
            raise RuntimeError("redis down")

    monkeypatch.setattr(realtime, "_bus", Broken())
    with caplog.at_level(logging.ERROR):
        await realtime.publish("trip-1", "vote_cast", {})  # must not raise
    assert "redis down" in caplog.text


def test_bus_is_memory_without_upstash_config(monkeypatch):
    monkeypatch.setattr(realtime, "_bus", None)
    monkeypatch.setattr(realtime.settings, "upstash_redis_rest_url", "")
    monkeypatch.setattr(realtime.settings, "upstash_redis_rest_token", "")
    assert isinstance(realtime.get_bus(), realtime.MemoryBus)


def test_bus_is_redis_with_upstash_config(monkeypatch):
    monkeypatch.setattr(realtime, "_bus", None)
    monkeypatch.setattr(realtime.settings, "upstash_redis_rest_url", "https://example.upstash.io")
    monkeypatch.setattr(realtime.settings, "upstash_redis_rest_token", "tok")
    assert isinstance(realtime.get_bus(), realtime.RedisBus)


class FakeRedis:
    """Minimal Redis Stream: integer ids, exclusive '(' start like the real XRANGE."""

    def __init__(self):
        self.entries: list[tuple[str, dict]] = []

    def add(self, event, data="{}"):
        entry_id = f"{len(self.entries) + 1}-0"
        self.entries.append((entry_id, {"event": event, "data": data}))
        return entry_id

    async def xrevrange(self, key, end, start, count=None):
        return list(reversed(self.entries))[:count]

    async def xrange(self, key, start, end):
        if start.startswith("("):
            after = int(start[1:].split("-")[0])
        else:
            after = int(start.split("-")[0]) - 1
        return [e for e in self.entries if int(e[0].split("-")[0]) > after]


def _redis_bus(fake, poll=0.01):
    bus = realtime.RedisBus.__new__(realtime.RedisBus)
    bus._redis = fake
    bus._POLL_INTERVAL_SECONDS = poll
    return bus


async def test_redis_bus_emits_entry_id_on_each_event():
    fake = FakeRedis()
    stream = _redis_bus(fake).subscribe("t")
    assert await asyncio.wait_for(stream.__anext__(), 1) == ": keepalive\n\n"  # subscribed, nothing yet
    fake.add("vote_cast", '{"n": 1}')
    assert await asyncio.wait_for(stream.__anext__(), 1) == 'id: 1-0\nevent: vote_cast\ndata: {"n": 1}\n\n'
    await stream.aclose()


async def test_redis_bus_replays_events_after_last_id():
    """The gap between two 300s streams: events published while nobody was connected."""
    fake = FakeRedis()
    fake.add("vote_cast", '{"n": 1}')
    missed = fake.add("task_completed", '{"n": 2}')
    stream = _redis_bus(fake).subscribe("t", last_id="1-0")
    assert (await asyncio.wait_for(stream.__anext__(), 1)).startswith(f"id: {missed}\n")
    await stream.aclose()


async def test_redis_bus_without_last_id_skips_history():
    fake = FakeRedis()
    fake.add("vote_cast")
    stream = _redis_bus(fake).subscribe("t")
    assert await asyncio.wait_for(stream.__anext__(), 1) == ": keepalive\n\n"
    await stream.aclose()


async def test_redis_bus_ends_stream_cleanly_at_max_seconds():
    stream = _redis_bus(FakeRedis()).subscribe("t", max_seconds=0.05)
    chunks = [c async for c in stream]  # must terminate on its own
    assert all(c == ": keepalive\n\n" for c in chunks)
