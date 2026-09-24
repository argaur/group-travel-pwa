import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../backend-auth", () => ({ getBackendToken: () => "test-token" }))

class FakeEventSource {
  static instances: FakeEventSource[] = []
  url: string
  closed = false
  onerror: (() => void) | null = null
  listeners: Record<string, ((e: MessageEvent) => void)[]> = {}

  constructor(url: string) {
    this.url = url
    FakeEventSource.instances.push(this)
  }

  addEventListener(type: string, cb: (e: MessageEvent) => void) {
    ;(this.listeners[type] ??= []).push(cb)
  }

  close() {
    this.closed = true
  }

  emitError() {
    this.onerror?.()
  }
}

describe("connectTripStream", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    FakeEventSource.instances = []
    // @ts-expect-error test double
    global.EventSource = FakeEventSource
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("includes the backend token as a query param", async () => {
    const { connectTripStream } = await import("../sse")
    connectTripStream("trip-1", () => {})
    expect(FakeEventSource.instances[0].url).toContain("token=test-token")
    expect(FakeEventSource.instances[0].url).toContain("/trips/trip-1/stream")
  })

  it("reconnects with the documented backoff sequence after an error", async () => {
    const { connectTripStream } = await import("../sse")
    connectTripStream("trip-1", () => {})

    const first = FakeEventSource.instances[0]
    first.emitError()
    expect(first.closed).toBe(true)
    expect(FakeEventSource.instances).toHaveLength(1) // not yet reconnected

    await vi.advanceTimersByTimeAsync(3_000)
    expect(FakeEventSource.instances).toHaveLength(2) // first backoff step: 3s

    FakeEventSource.instances[1].emitError()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(FakeEventSource.instances).toHaveLength(3) // second backoff step: 10s
  })

  it("stops reconnecting once the returned cleanup function is called", async () => {
    const { connectTripStream } = await import("../sse")
    const stop = connectTripStream("trip-1", () => {})

    const first = FakeEventSource.instances[0]
    stop()
    expect(first.closed).toBe(true)

    first.emitError()
    await vi.advanceTimersByTimeAsync(30_000)
    expect(FakeEventSource.instances).toHaveLength(1) // no reconnect after stop()
  })
})
