/**
 * SSE connection manager for the group trip dashboard.
 * Reconnects automatically with exponential backoff (3s → 10s → 30s).
 *
 * Usage:
 *   const disconnect = connectTripStream(tripId, (event) => {
 *     if (event.type === "task_completed") { ... }
 *   });
 *   // call disconnect() on component unmount
 */

export type SSEEvent =
  | { type: "task_completed";       data: { task_id: string; title: string; completed_by: string } }
  | { type: "member_joined";        data: { user_id: string; name: string; joined_at: string } }
  | { type: "vote_cast";            data: { vote_type: string; tally: Record<string, number> } }
  | { type: "expense_added";        data: { amount: number; category: string; paid_by: string } }
  | { type: "preference_submitted"; data: { count_responded: number; count_total: number } };

const BACKOFF_MS = [3_000, 10_000, 30_000];
const API_BASE   = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const EVENT_TYPES: SSEEvent["type"][] = [
  "task_completed",
  "member_joined",
  "vote_cast",
  "expense_added",
  "preference_submitted",
];

export function connectTripStream(
  tripId: string,
  onEvent: (event: SSEEvent) => void,
): () => void {
  let es: EventSource;
  let attempt = 0;
  let stopped = false;

  function connect() {
    es = new EventSource(`${API_BASE}/trips/${tripId}/stream`, { withCredentials: true });

    EVENT_TYPES.forEach((type) => {
      es.addEventListener(type, (e: MessageEvent) => {
        attempt = 0; // reset backoff on successful message
        try {
          onEvent({ type, data: JSON.parse(e.data) } as SSEEvent);
        } catch {
          console.error("[SSE] Failed to parse event data", e.data);
        }
      });
    });

    es.onerror = () => {
      es.close();
      if (stopped) return;
      const delay = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
      attempt++;
      setTimeout(connect, delay);
    };
  }

  connect();

  return () => {
    stopped = true;
    es?.close();
  };
}
