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
          <form onSubmit={addItem} className="card p-5 md:p-6 space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-xl" style={{ fontFamily: "var(--serif)", fontWeight: 600 }}>Chart a stop</h2>
              <span className="m-label">Organizer</span>
            </div>
            <div>
              <label className="field-label block mb-1.5">Day number</label>
              <input
                className="field-input"
                placeholder="1"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                type="number"
                min={1}
              />
            </div>
            <div>
              <label className="field-label block mb-1.5">Item title</label>
              <input
                className="field-input"
                placeholder="e.g. Sunrise trek"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            {selectedPlace ? (
              <div className="flex items-center justify-between gap-2 px-3 py-2" style={{ border: "1.5px solid var(--ink-15)" }}>
                <PlacePreviewMini
                  name={selectedPlace.name}
                  photoUrl={selectedPlace.primary_photo_url}
                  rating={selectedPlace.rating}
                />
                <button type="button" className="cta-ghost shrink-0" onClick={() => setSelectedPlace(null)}>
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
            <button className="cta sm w-full">
              Add to route <span className="arrow" aria-hidden="true">→</span>
            </button>
          </form>
        ) : (
          <div className="card p-5 md:p-6">
            <span className="fig-tag" style={{ marginBottom: 12 }}><b>◆</b> Read only</span>
            <p className="text-sm mt-2" style={{ fontFamily: "var(--body)", color: "var(--ink-60)" }}>
              Only the trip leader can add or edit route stops. You can comment on any item.
            </p>
          </div>
        )}

        <div className="card p-5 md:p-6">
          <div className="flex items-baseline justify-between gap-3 mb-4">
            <h2 className="text-xl" style={{ fontFamily: "var(--serif)", fontWeight: 600 }}>The route so far</h2>
            <span className="m-label"><b>{items.length}</b> stops</span>
          </div>
          {/* Route: waypoints threaded along a dashed line */}
          <div>
            {items.map((item) => (
              <div
                key={item.id}
                className="relative pl-7 pb-4"
                style={{ borderLeft: "1px dashed var(--ink-15)" }}
              >
                {/* Waypoint node */}
                <span
                  className="absolute"
                  style={{ left: -5, top: 4, width: 9, height: 9, background: "var(--accent)" }}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  className="text-left w-full"
                  onClick={() => setExpanded((e) => (e === item.id ? null : item.id))}
                >
                  <span className="m-label" style={{ color: "var(--accent)", fontWeight: 700, letterSpacing: "0.2em" }}>
                    Day {item.day_number}
                  </span>
                  <p className="text-[17px] mt-0.5" style={{ fontFamily: "var(--serif)", fontWeight: 600, color: "var(--ink)" }}>
                    {item.title}
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
                    <p className="text-sm mt-0.5" style={{ fontFamily: "var(--body)", color: "var(--ink-60)" }}>{item.location}</p>
                  ) : null}
                  <p className="m-label mt-1.5">
                    {expanded === item.id ? "Hide comments ▲" : "Comments ▾"}
                  </p>
                </button>

                {isOrganizer && (
                  <div className="pt-1.5">
                    {itemPlacePicker === item.id ? (
                      <div className="space-y-1.5">
                        <PlaceSearchInput
                          value=""
                          onChange={() => {}}
                          onSelect={(place) => saveItemPlace(item.id, place)}
                          placeholder="Search Google Places…"
                        />
                        <button type="button" className="cta-ghost" onClick={() => setItemPlacePicker(null)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button type="button" className="cta-ghost" onClick={() => setItemPlacePicker(item.id)}>
                        {item.place_name ? "Change place" : "Add place"}
                      </button>
                    )}
                  </div>
                )}

                {expanded === item.id && (
                  <div className="pt-3 mt-2 space-y-2" style={{ borderTop: "1px dashed var(--ink-15)" }}>
                    {(commentsByItem[item.id] || []).map((c) => (
                      <div key={c.id} className="text-sm px-3 py-2" style={{ background: "var(--ink-08)" }}>
                        <span style={{ fontFamily: "var(--body)", fontWeight: 600 }}>{c.user.name}</span>
                        <span style={{ fontFamily: "var(--body)", color: "var(--ink-60)" }}>: {c.body}</span>
                      </div>
                    ))}
                    <div className="flex gap-2 items-end">
                      <input
                        className="field-input flex-1"
                        placeholder="Add a comment"
                        value={commentDraft[item.id] || ""}
                        onChange={(e) =>
                          setCommentDraft((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                      />
                      <button type="button" className="cta sm shrink-0" onClick={() => postComment(item.id)}>
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {items.length === 0 && (
            <p className="m-label py-4">Nothing charted yet — the route is still being drawn</p>
          )}
      </div>
      </div>

      <div className="card p-5 md:p-6 mt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="fig-tag" style={{ marginBottom: 8 }}><b>FIG. AI</b> Best possible day</span>
            <p className="text-sm mt-2" style={{ fontFamily: "var(--body)", color: "var(--ink-60)" }}>
              Organizer-triggered suggestion — falls back to a sample layout if AI is unavailable.
            </p>
          </div>
          <div className="flex gap-2 items-end">
            <div>
              <label className="field-label block mb-1">Day</label>
              <input
                type="number"
                min={1}
                className="field-input"
                style={{ width: 72 }}
                value={aiDay}
                onChange={(e) => setAiDay(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="cta sm"
              disabled={!isOrganizer || aiLoading}
              onClick={suggestAi}
            >
              {aiLoading ? "Generating…" : "Generate"}
            </button>
          </div>
        </div>
        {!isOrganizer && (
          <p className="m-label">Only the leader can request a new AI draft</p>
        )}
        {aiPanel && (
          <pre
            className="overflow-auto max-h-80 p-4"
            style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink)", border: "1px solid var(--ink-15)", background: "var(--ink-08)" }}
          >
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
