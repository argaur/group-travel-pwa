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
