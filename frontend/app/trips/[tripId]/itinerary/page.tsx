"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { ensureBackendToken, getBackendUserId } from "@/lib/backend-auth"
import AppShell from "@/components/AppShell"
import TripPlanningGate from "@/components/TripPlanningGate"

type Item = {
  id: string
  day_number: number
  title: string
  location: string | null
}

type MemberRow = {
  user: { id: string; name: string }
  role: string
}

type Comment = {
  id: string
  body: string
  created_at: string | null
  user: { id: string; name: string; avatar_url: string | null }
}

function ItineraryContent() {
  const params = useParams<{ tripId: string }>()
  const [items, setItems] = useState<Item[]>([])
  const [members, setMembers] = useState<MemberRow[]>([])
  const [destination, setDestination] = useState<string | null>(null)
  const [day, setDay] = useState("1")
  const [title, setTitle] = useState("")
  const [location, setLocation] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [commentsByItem, setCommentsByItem] = useState<Record<string, Comment[]>>({})
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({})
  const [aiPanel, setAiPanel] = useState<object | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiDay, setAiDay] = useState("1")

  const myId = getBackendUserId()
  const isOrganizer = members.some(
    (m) => m.user.id === myId && m.role === "organizer",
  )

  const load = useCallback(async () => {
    await ensureBackendToken()
    const [data, mems, trip] = await Promise.all([
      api.get<Item[]>(`/trips/${params.tripId}/itinerary`),
      api.get<MemberRow[]>(`/trips/${params.tripId}/members`),
      api.get<{ destination: string | null }>(`/trips/${params.tripId}`),
    ])
    setItems(data)
    setMembers(mems)
    setDestination(trip.destination)
  }, [params.tripId])

  useEffect(() => {
    load()
  }, [load])

  const loadComments = useCallback(
    async (itemId: string) => {
      const list = await api.get<Comment[]>(
        `/trips/${params.tripId}/itinerary/items/${itemId}/comments`,
      )
      setCommentsByItem((prev) => ({ ...prev, [itemId]: list }))
    },
    [params.tripId],
  )

  useEffect(() => {
    if (expanded) void loadComments(expanded)
  }, [expanded, loadComments])

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!isOrganizer) return
    await api.post(`/trips/${params.tripId}/itinerary/days/${day}/items`, {
      title,
      location: location || null,
    })
    setTitle("")
    setLocation("")
    load()
  }

  async function postComment(itemId: string) {
    const body = (commentDraft[itemId] || "").trim()
    if (!body) return
    await api.post(`/trips/${params.tripId}/itinerary/items/${itemId}/comments`, {
      body,
    })
    setCommentDraft((prev) => ({ ...prev, [itemId]: "" }))
    loadComments(itemId)
  }

  async function suggestAi() {
    const dest = destination || "Your destination"
    setAiLoading(true)
    try {
      const res = await api.post<{ suggested: object; source: string }>(
        `/trips/${params.tripId}/itinerary/ai-suggest`,
        {
          day_number: Number(aiDay),
          destination: dest,
          context: "Group trip — balance dietary variety and downtime.",
        },
      )
      setAiPanel(res.suggested)
    } catch {
      setAiPanel({ error: "Could not load AI suggestion." })
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <AppShell
      tripId={params.tripId}
      active="itinerary"
      title="Itinerary"
      subtitle="Leader builds the plan · everyone can comment"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {isOrganizer ? (
          <form onSubmit={addItem} className="card p-5 space-y-3">
            <h2 className="text-lg font-semibold">Add item (organizer)</h2>
            <input
              className="w-full border border-black/10 rounded-xl px-3 py-2"
              placeholder="Day number"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              type="number"
              min={1}
            />
            <input
              className="w-full border border-black/10 rounded-xl px-3 py-2"
              placeholder="Item title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <input
              className="w-full border border-black/10 rounded-xl px-3 py-2"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button className="w-full rounded-full bg-[var(--ink)] text-white px-4 py-2">
              Add item
            </button>
          </form>
        ) : (
          <div className="card p-5 text-sm text-[var(--muted)]">
            Only the trip leader can add or edit itinerary blocks. You can comment on any item.
          </div>
        )}

        <div className="card p-5 space-y-3">
          <h2 className="text-lg font-semibold">Schedule</h2>
          {items.map((item) => (
            <div key={item.id} className="border border-black/5 rounded-2xl p-4 space-y-2">
              <button
                type="button"
                className="text-left w-full"
                onClick={() =>
                  setExpanded((e) => (e === item.id ? null : item.id))
                }
              >
                <p className="font-medium">
                  Day {item.day_number}: {item.title}
                </p>
                {item.location && (
                  <p className="text-sm text-[var(--muted)]">{item.location}</p>
                )}
                <p className="text-xs text-[var(--muted)] mt-1">
                  {expanded === item.id ? "Hide comments" : "Comments"}
                </p>
              </button>
              {expanded === item.id && (
                <div className="border-t border-black/5 pt-3 space-y-2">
                  {(commentsByItem[item.id] || []).map((c) => (
                    <div key={c.id} className="text-sm rounded-xl bg-black/[0.03] px-3 py-2">
                      <span className="font-medium">{c.user.name}</span>: {c.body}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      className="flex-1 border border-black/10 rounded-xl px-3 py-2 text-sm"
                      placeholder="Add a comment"
                      value={commentDraft[item.id] || ""}
                      onChange={(e) =>
                        setCommentDraft((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="rounded-full bg-[var(--ink)] text-white px-4 py-2 text-sm"
                      onClick={() => postComment(item.id)}
                    >
                      Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-[var(--muted)]">No itinerary items yet.</p>
          )}
      </div>
      </div>

      <div className="card p-5 mt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">AI best possible day (preview)</h2>
            <p className="text-sm text-[var(--muted)]">
              Organizer-triggered suggestion — falls back to a sample layout if AI is unavailable.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min={1}
              className="w-20 border border-black/10 rounded-xl px-3 py-2 text-sm"
              value={aiDay}
              onChange={(e) => setAiDay(e.target.value)}
            />
            <button
              type="button"
              className="rounded-full bg-[var(--ink)] text-white px-4 py-2 text-sm disabled:opacity-50"
              disabled={!isOrganizer || aiLoading}
              onClick={suggestAi}
            >
              {aiLoading ? "Generating…" : "Generate"}
            </button>
          </div>
        </div>
        {!isOrganizer && (
          <p className="text-xs text-[var(--muted)]">Only the leader can request a new AI draft.</p>
        )}
        {aiPanel && (
          <pre className="text-xs overflow-auto max-h-80 border border-black/5 rounded-2xl p-4 bg-black/[0.02]">
            {JSON.stringify(aiPanel, null, 2)}
          </pre>
        )}
      </div>
    </AppShell>
  )
}

export default function ItineraryPage() {
  const params = useParams<{ tripId: string }>()
  return (
    <TripPlanningGate tripId={params.tripId}>
      <ItineraryContent />
    </TripPlanningGate>
  )
}
