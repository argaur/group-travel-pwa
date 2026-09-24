/**
 * SSE connection manager for the group trip dashboard.
 * Reconnects automatically with exponential backoff (3s → 10s → 30s).
 *
 * Auth: pass JWT as query param (?token=) because browser EventSource cannot set Authorization headers.
 */

import { getBackendToken } from "./backend-auth"

export type SSEEvent =
  | { type: "task_completed"; data: { task_id: string; title: string; completed_by: string } }
  | { type: "member_joined"; data: { user_id: string; name: string } }
  | { type: "vote_cast"; data: { vote_type: string; tally: Record<string, number> } }
  | { type: "expense_added"; data: { amount: number; category: string; paid_by: string } }
  | {
      type: "preference_submitted"
      data: { count_responded: number; count_total: number }
    }
  | {
      type: "leader_transferred"
      data: {
        previous_leader_id: string
        previous_leader_name: string
        new_leader_id: string
        new_leader_name: string
      }
    }
  | { type: "rsvp_updated"; data: { user_id: string; rsvp_status: string } }

const CLEAN_RECONNECT_MS = 500
const BACKOFF_MS = [3_000, 10_000, 30_000]
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

const EVENT_TYPES: SSEEvent["type"][] = [
  "task_completed",
  "member_joined",
  "vote_cast",
  "expense_added",
  "preference_submitted",
  "leader_transferred",
  "rsvp_updated",
]

export function connectTripStream(
  tripId: string,
  onEvent: (event: SSEEvent) => void,
): () => void {
  let es: EventSource
  let attempt = 0
  let stopped = false
  let lastEventId = ""
  let opened = false

  function streamUrl(): string {
    const token = getBackendToken()
    const params = new URLSearchParams()
    if (token) params.set("token", token)
    if (lastEventId) params.set("last_id", lastEventId)
    const qs = params.size ? `?${params}` : ""
    return `${API_BASE}/trips/${tripId}/stream${qs}`
  }

  function connect() {
    opened = false
    es = new EventSource(streamUrl(), { withCredentials: true })
    es.onopen = () => {
      opened = true
    }

    EVENT_TYPES.forEach((type) => {
      es.addEventListener(type, (e: MessageEvent) => {
        attempt = 0
        if (e.lastEventId) lastEventId = e.lastEventId
        try {
          onEvent({ type, data: JSON.parse(e.data) } as SSEEvent)
        } catch {
          console.error("[SSE] Failed to parse event data", e.data)
        }
      })
    })

    es.onerror = () => {
      es.close()
      if (stopped) return
      let delay: number
      if (opened) {
        attempt = 0
        delay = CLEAN_RECONNECT_MS
      } else {
        delay = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)]
        attempt++
      }
      setTimeout(connect, delay)
    }
  }

  connect()

  return () => {
    stopped = true
    es?.close()
  }
}
