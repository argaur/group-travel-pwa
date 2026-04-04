"use client"

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { connectTripStream } from "@/lib/sse"
import { subscribeToPush } from "@/lib/pwa"
import {
  ensureBackendToken,
  getBackendUserId,
} from "@/lib/backend-auth"
import AppShell from "@/components/AppShell"
import PlaceCard from "@/components/places/PlaceCard"

type MemberRow = {
  user: { id: string; name: string; avatar_url: string | null }
  role: string
  is_creator: boolean
  preference_submitted: boolean
}

type DashboardSummary = {
  trip: {
    id: string
    name: string
    destination: string | null
    start_date: string | null
    end_date: string | null
    trip_type: string
    status: string
  }
  members_total: number
  preferences_responded: number
  preference_snapshot: {
    budget_overlap: { min: number; max: number } | null
    dietary_union: string[]
    gap_flags: string[]
  }
  tasks: { by_status: Record<string, number>; total: number }
  itinerary_preview: Array<{
    id: string
    day_number: number
    title: string
    location: string | null
    start_time: string | null
  }>
}

const VOTE_TOPICS = [
  { type: "destination", label: "Destination" },
  { type: "dates", label: "Dates" },
  { type: "accommodation", label: "Accommodation" },
] as const

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return "Unknown error"
}

export default function DashboardPage() {
  const params = useParams<{ tripId: string }>()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [members, setMembers] = useState<MemberRow[]>([])
  const [lastEvent, setLastEvent] = useState("")
  const [pushStatus, setPushStatus] = useState<string | null>(null)
  const [transferTo, setTransferTo] = useState("")
  const [transferMsg, setTransferMsg] = useState<string | null>(null)
  const [placeId, setPlaceId] = useState<string | null>(null)
  const [voteTallies, setVoteTallies] = useState<Record<string, Record<string, number>>>({})
  const [error, setError] = useState<string | null>(null)

  const myId = getBackendUserId()
  const me = useMemo(
    () => members.find((m) => m.user.id === myId),
    [members, myId],
  )
  const isOrganizer = me?.role === "organizer"

  const load = useCallback(async () => {
    try {
      await ensureBackendToken()
      const [dash, mems] = await Promise.all([
        api.get<DashboardSummary>(`/trips/${params.tripId}/dashboard-summary`),
        api.get<MemberRow[]>(`/trips/${params.tripId}/members`),
      ])
      setSummary(dash)
      setMembers(mems)
      setError(null)
      // Pick up place_id from trip data if available (set via PUT /trips/{id}/place)
      setPlaceId((dash.trip as unknown as { place_id?: string }).place_id ?? null)

      // Fetch vote tallies for all topics (non-blocking — silently ignore errors)
      const tallyResults = await Promise.allSettled(
        VOTE_TOPICS.map((t) =>
          api.get<Record<string, number>>(`/trips/${params.tripId}/votes/${t.type}`)
        )
      )
      const tallies: Record<string, Record<string, number>> = {}
      VOTE_TOPICS.forEach((t, i) => {
        const r = tallyResults[i]
        tallies[t.type] = r.status === "fulfilled" ? (r.value ?? {}) : {}
      })
      setVoteTallies(tallies)
    } catch (error: unknown) {
      setError(`Failed to load trip data: ${getErrorMessage(error)}`)
      setSummary(null) // Keep summary null to show error UI
    }
  }, [params.tripId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const disconnect = connectTripStream(params.tripId, (event) => {
      setLastEvent(event.type)
      if (
        event.type === "preference_submitted" ||
        event.type === "member_joined" ||
        event.type === "leader_transferred" ||
        event.type === "vote_cast"
      ) {
        load().catch(() => {})
      }
    })
    return disconnect
  }, [params.tripId, load])

  const title = useMemo(() => summary?.trip.name ?? "Trip dashboard", [summary])


  async function enablePush() {
    const sub = await subscribeToPush()
    if (!sub) {
      setPushStatus("Permission denied or unsupported")
      return
    }
    await api.post("/push/subscribe", {
      trip_id: params.tripId,
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.toJSON().keys?.p256dh,
        auth: sub.toJSON().keys?.auth,
      },
    })
    setPushStatus("Notifications enabled")
  }

  async function transferLeadership() {
    if (!transferTo) return
    setTransferMsg(null)
    try {
      await api.post(`/trips/${params.tripId}/members/transfer-organizer`, {
        to_user_id: transferTo,
      })
      setTransferMsg("Leadership transferred.")
      setTransferTo("")
      await load()
    } catch {
      setTransferMsg("Could not transfer. Try again.")
    }
  }

  if (!summary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <p className="text-sm text-[var(--muted)]">Loading trip…</p>
        )}
      </div>
    )
  }

  const taskTodo =
    (summary.tasks.by_status.todo ?? 0) +
    (summary.tasks.by_status.in_progress ?? 0)
  const taskDone = summary.tasks.by_status.done ?? 0

  return (
    <AppShell
      tripId={params.tripId}
      active="dashboard"
      title={title}
      subtitle={`${summary.trip.destination ?? "Destination TBD"} · ${summary.trip.trip_type}`}
    >
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card p-5 bg-gradient-to-br from-[var(--accent-coral)] to-[var(--accent-pink)] text-white animate-fade-up">
              <p className="text-sm/80">Alignment</p>
              <p className="text-3xl font-semibold mt-2">
                {summary.preferences_responded}/{summary.members_total}
              </p>
              <p className="text-sm/80">Preferences in</p>
            </div>
            <div className="card p-5 animate-fade-up">
              <p className="text-sm text-[var(--muted)]">Tasks</p>
              <p className="text-2xl font-semibold mt-2">{summary.tasks.total}</p>
              <p className="text-xs text-[var(--muted)] mt-1">
                {taskTodo} active · {taskDone} done
              </p>
            </div>
            <div className="card p-5 animate-fade-up">
              <p className="text-sm text-[var(--muted)]">Live</p>
              <p className="text-lg font-semibold mt-2">{lastEvent || "—"}</p>
              <p className="text-xs text-[var(--muted)] mt-1">Latest SSE event</p>
            </div>
          </div>

          <div className="card p-5 space-y-3 animate-fade-up">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Group decisions</h2>
              <a
                href={`/trips/${params.tripId}/vote`}
                className="text-xs rounded-full border border-black/10 px-3 py-1.5 hover:bg-black/5 transition-colors"
              >
                Open voting →
              </a>
            </div>
            <ul className="space-y-2">
              {VOTE_TOPICS.map((topic) => {
                const tally = voteTallies[topic.type] ?? {}
                const entries = Object.entries(tally)
                const totalVotes = entries.reduce((s, [, c]) => s + c, 0)
                const topOption = entries.sort((a, b) => b[1] - a[1])[0]
                return (
                  <li
                    key={topic.type}
                    className="flex flex-wrap items-center justify-between gap-2 border border-black/5 rounded-2xl px-4 py-3 text-sm"
                  >
                    <span className="font-medium">{topic.label}</span>
                    {totalVotes === 0 ? (
                      <span className="text-[var(--muted)]">No votes yet</span>
                    ) : (
                      <span className="text-[var(--muted)]">
                        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                        {topOption ? ` · leading: ${topOption[0]}` : ""}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="card p-5 space-y-3 animate-fade-up">
            <h2 className="text-lg font-semibold">Budget & diets (snapshot)</h2>
            {summary.preference_snapshot.budget_overlap ? (
              <p className="text-sm">
                Overlap ~₹{summary.preference_snapshot.budget_overlap.min}–₹
                {summary.preference_snapshot.budget_overlap.max} / day
              </p>
            ) : (
              <p className="text-sm text-[var(--muted)]">No overlapping budget band yet.</p>
            )}
            {summary.preference_snapshot.dietary_union.length > 0 && (
              <p className="text-sm">
                Dietary tags: {summary.preference_snapshot.dietary_union.join(", ")}
              </p>
            )}
            {summary.preference_snapshot.gap_flags.length > 0 && (
              <p className="text-xs text-amber-700">
                Flags: {summary.preference_snapshot.gap_flags.join(", ")}
              </p>
            )}
            <a
              className="inline-block text-sm underline text-[var(--muted)]"
              href={`/trips/${params.tripId}/preferences/summary`}
            >
              Open full anonymous breakdown
            </a>
          </div>

          {placeId && (
            <div className="card p-5 space-y-3 animate-fade-up">
              <h2 className="text-lg font-semibold">Destination intel</h2>
              <PlaceCard placeId={placeId} />
            </div>
          )}

          <div className="card p-5 space-y-3 animate-fade-up">
            <h2 className="text-lg font-semibold">Itinerary preview (days 1–2)</h2>
            {summary.itinerary_preview.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No items yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {summary.itinerary_preview.map((it) => (
                  <li key={it.id} className="border border-black/5 rounded-xl px-3 py-2">
                    Day {it.day_number}: {it.title}
                    {it.location ? ` · ${it.location}` : ""}
                  </li>
                ))}
              </ul>
            )}
            <a
              className="text-sm underline text-[var(--muted)]"
              href={`/trips/${params.tripId}/itinerary`}
            >
              Open itinerary builder
            </a>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <a
              className="card card-interactive p-5 animate-fade-up"
              href={`/trips/${params.tripId}/preferences/summary`}
            >
              <p className="text-sm text-[var(--muted)]">Preferences</p>
              <p className="text-lg font-semibold mt-1">Anonymous breakdown</p>
            </a>
            <a className="card card-interactive p-5 animate-fade-up" href={`/trips/${params.tripId}/tasks`}>
              <p className="text-sm text-[var(--muted)]">Tasks</p>
              <p className="text-lg font-semibold mt-1">Assign &amp; track</p>
            </a>
            <a
              className="card card-interactive p-5 animate-fade-up"
              href={`/trips/${params.tripId}/expenses`}
            >
              <p className="text-sm text-[var(--muted)]">Expenses</p>
              <p className="text-lg font-semibold mt-1">Track spend</p>
            </a>
            <a className="card card-interactive p-5 animate-fade-up" href={`/trips/${params.tripId}/itinerary`}>
              <p className="text-sm text-[var(--muted)]">Itinerary</p>
              <p className="text-lg font-semibold mt-1">Day plan</p>
            </a>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="card p-5 space-y-3 animate-fade-up">
            <h2 className="text-lg font-semibold">Group members</h2>
            <ul className="space-y-2 text-sm">
              {members.map((m) => (
                <li
                  key={m.user.id}
                  className="flex items-center justify-between gap-2 border border-black/5 rounded-xl px-3 py-2"
                >
                  <div>
                    <p className="font-medium">{m.user.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {m.role === "organizer" ? "Leader" : "Member"}
                      {m.is_creator ? " · Created trip" : ""}
                      {m.preference_submitted ? " · Prefs ✓" : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            {isOrganizer && members.length > 1 && (
              <div className="pt-2 space-y-2 border-t border-black/5">
                <p className="text-xs text-[var(--muted)]">Transfer leader role</p>
                <select
                  className="w-full border border-black/10 rounded-xl px-3 py-2 text-sm"
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                >
                  <option value="">Choose member…</option>
                  {members
                    .filter((m) => m.user.id !== myId)
                    .map((m) => (
                      <option key={m.user.id} value={m.user.id}>
                        {m.user.name}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  className="w-full rounded-full bg-[var(--ink)] text-white px-4 py-2 text-sm"
                  disabled={!transferTo}
                  onClick={transferLeadership}
                >
                  Transfer leadership
                </button>
                {transferMsg && (
                  <p className="text-xs text-[var(--muted)]">{transferMsg}</p>
                )}
              </div>
            )}
          </div>

          <div className="card card-interactive p-5 animate-fade-up">
            <p className="text-sm text-[var(--muted)]">Notifications</p>
            <p className="text-lg font-semibold mt-1">Enable alerts</p>
            <button
              className="mt-4 w-full rounded-full bg-[var(--ink)] text-white px-4 py-2 text-sm"
              onClick={enablePush}
            >
              Enable
            </button>
            {pushStatus && (
              <p className="text-xs text-[var(--muted)] mt-2">{pushStatus}</p>
            )}
          </div>

          <div className="card card-interactive p-5 animate-fade-up">
            <p className="text-sm text-[var(--muted)]">Invite</p>
            <p className="text-lg font-semibold mt-1">Share link</p>
            <a
              className="mt-4 inline-block rounded-full border border-black/10 px-4 py-2 text-sm"
              href={`/trips/${params.tripId}/join`}
            >
              Open invite flow
            </a>
          </div>

          {!me?.preference_submitted && (
            <div className="card p-4 border border-amber-200 bg-amber-50 text-amber-900 text-sm animate-fade-up">
              Complete your preference survey to unlock tasks, itinerary editing, and expenses.
              <a
                className="block mt-2 font-semibold underline"
                href={`/trips/${params.tripId}/preferences`}
              >
                Go to survey
              </a>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
