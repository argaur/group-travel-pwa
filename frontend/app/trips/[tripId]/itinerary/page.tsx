"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { ensureBackendToken, getBackendUserId } from "@/lib/backend-auth"
import AppShell from "@/components/AppShell"
import TripPlanningGate from "@/components/TripPlanningGate"
import PlaceSearchInput, { type PlaceResult } from "@/components/places/PlaceSearchInput"
import PlacePreviewMini from "@/components/places/PlacePreviewMini"

type Item = {
  id: string
  day_number: number
  title: string
  location: string | null
  place_id: string | null
  place_name: string | null
  place_photo_url: string | null
  place_rating: number | null
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
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null)
  const [itemPlacePicker, setItemPlacePicker] = useState<string | null>(null) // item id with open picker
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
    const item = await api.post<Item>(`/trips/${params.tripId}/itinerary/days/${day}/items`, {
      title,
      location: selectedPlace?.name || location || null,
    })
    if (selectedPlace) {
      await api.put(`/trips/${params.tripId}/itinerary/items/${item.id}/place`, {
        place_id: selectedPlace.place_id,
        place_name: selectedPlace.name,
        place_photo_url: selectedPlace.primary_photo_url ?? null,
        place_rating: selectedPlace.rating ?? null,
      }).catch(() => {/* non-blocking */})
    }
    setTitle("")
    setLocation("")
    setSelectedPlace(null)
    load()
  }

  async function saveItemPlace(itemId: string, place: PlaceResult) {
    await api.put(`/trips/${params.tripId}/itinerary/items/${itemId}/place`, {
      place_id: place.place_id,
      place_name: place.name,
      place_photo_url: place.primary_photo_url ?? null,
      place_rating: place.rating ?? null,
    })
    setItemPlacePicker(null)
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
            {selectedPlace ? (
              <div className="flex items-center justify-between gap-2 border border-black/10 rounded-xl px-3 py-2">
                <PlacePreviewMini
                  name={selectedPlace.name}
                  photoUrl={selectedPlace.primary_photo_url}
                  rating={selectedPlace.rating}
                />
                <button
                  type="button"
                  className="text-xs text-[var(--muted)] underline shrink-0"
                  onClick={() => setSelectedPlace(null)}
                >
                  Clear
                </button>
              </div>
            ) : (
              <PlaceSearchInput
                value={location}
                onChange={setLocation}
                onSelect={(place) => { setSelectedPlace(place); setLocation(place.name) }}
                placeholder="Search location (Google Places)…"
              />
            )}
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
                {item.place_name ? (
                  <div className="mt-1.5">
                    <PlacePreviewMini
                      name={item.place_name}
                      photoUrl={item.place_photo_url}
                      rating={item.place_rating}
                    />
                  </div>
                ) : item.location ? (
                  <p className="text-sm text-[var(--muted)]">{item.location}</p>
                ) : null}
                <p className="text-xs text-[var(--muted)] mt-1">
                  {expanded === item.id ? "Hide comments" : "Comments"}
                </p>
              </button>

              {isOrganizer && (
                <div className="pt-1">
                  {itemPlacePicker === item.id ? (
                    <div className="space-y-1.5">
                      <PlaceSearchInput
                        value=""
                        onChange={() => {}}
                        onSelect={(place) => saveItemPlace(item.id, place)}
                        placeholder="Search Google Places…"
                      />
                      <button
                        type="button"
                        className="text-xs text-[var(--muted)] underline"
                        onClick={() => setItemPlacePicker(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="text-xs text-[var(--muted)] underline"
                      onClick={() => setItemPlacePicker(item.id)}
                    >
                      {item.place_name ? "Change place" : "Add place"}
                    </button>
                  )}
                </div>
              )}

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
