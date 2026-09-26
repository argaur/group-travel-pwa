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
import { tallyOf, type VoteState } from "@/lib/votes"

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

/* ── FIG. 1 — the Silent Conflict Surfacer, drawn as terrain ─────────────────
   The group is rendered as contour lines travelling from THE PARTY (left)
   toward THE TRIP (right). Where preferences align, the lines run together;
   for every gap the AI flags — or when no budget band overlaps at all — the
   terrain pulls apart. The vermillion route threads the navigable pass and
   carries the actual overlap band when one exists. Data in, terrain out:
   nothing here is decoration. */

function SurfacerTerrain({
  snapshot,
  destination,
  respondedLabel,
}: {
  snapshot: DashboardSummary["preference_snapshot"]
  destination: string | null
  respondedLabel: string
}) {
  const { budget_overlap, gap_flags } = snapshot
  // Divergence 0..1 — how far the terrain fans apart on the right.
  const divergence = budget_overlap === null ? 1 : Math.min(1, gap_flags.length * 0.33)

  const X0 = 36
  const X1 = 596
  const CY = 118
  // Five contours: tight at the party, fanned by divergence at the trip.
  const contours = [-2, -1, 0, 1, 2].map((i) => {
    const yL = CY + i * 6
    const yR = CY + i * (10 + divergence * 34)
    return { i, d: `M ${X0} ${yL} C 230 ${yL}, 400 ${yR}, ${X1} ${yR}` }
  })

  return (
    <svg
      viewBox="0 0 640 236"
      role="img"
      aria-label={
        budget_overlap
          ? `Terrain chart: the group's preferences diverge by ${gap_flags.length} flagged gap${gap_flags.length === 1 ? "" : "s"}; a navigable budget pass exists at ₹${budget_overlap.min} to ₹${budget_overlap.max} per day`
          : "Terrain chart: the group's budget ranges do not overlap yet — the contour lines fan fully apart"
      }
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {contours.map(({ i, d }) =>
        i === 0 ? (
          <path
            key={i}
            className="route-path"
            d={d}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        ) : (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="var(--ink)"
            strokeWidth="1.3"
            opacity={Math.abs(i) === 1 ? 0.4 : 0.65}
          />
        )
      )}

      {/* Hatch the divergence zone when gaps exist */}
      {divergence > 0.2 && (
        <g stroke="var(--accent)" strokeWidth="1" opacity=".3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line key={i} x1={430 + i * 26} y1={CY - 46 - divergence * 20} x2={410 + i * 26} y2={CY + 46 + divergence * 20} />
          ))}
        </g>
      )}

      {/* THE PARTY — you are here */}
      <g>
        <circle className="you-dot" cx={X0} cy={CY} r="6" fill="var(--accent)" />
        <circle cx={X0} cy={CY} r="11" fill="none" stroke="var(--accent)" strokeWidth="1" opacity=".5" />
        <text x={X0 - 12} y={CY + 44} fontFamily="var(--mono)" fontSize="10" letterSpacing="2" fill="var(--ink)" fontWeight="700">
          THE PARTY
        </text>
        <text x={X0 - 12} y={CY + 58} fontFamily="var(--mono)" fontSize="8.5" letterSpacing="1.5" fill="var(--ink-60)">
          {respondedLabel}
        </text>
      </g>

      {/* THE TRIP — X marks the spot */}
      <g>
        <g stroke="var(--accent)" strokeWidth="3" strokeLinecap="round">
          <line x1={X1 + 8} y1={CY - 8} x2={X1 + 24} y2={CY + 8} />
          <line x1={X1 + 24} y1={CY - 8} x2={X1 + 8} y2={CY + 8} />
        </g>
        <text x={X1 + 24} y={CY - 18} fontFamily="var(--mono)" fontSize="10" letterSpacing="2" fill="var(--ink)" fontWeight="700" textAnchor="end">
          {(destination ?? "THE TRIP").toUpperCase().slice(0, 14)}
        </text>
      </g>

      {/* The pass — or the missing one */}
      {budget_overlap ? (
        <g>
          <text x="316" y="216" fontFamily="var(--mono)" fontSize="10.5" letterSpacing="2.5" fill="var(--accent)" fontWeight="700" textAnchor="middle">
            NAVIGABLE PASS — ₹{budget_overlap.min}–₹{budget_overlap.max} / DAY
          </text>
        </g>
      ) : (
        <g>
          <text x="316" y="216" fontFamily="var(--mono)" fontSize="10.5" letterSpacing="2.5" fill="var(--accent)" fontWeight="700" textAnchor="middle">
            NO COMMON BUDGET YET — TERRAIN OPEN
          </text>
        </g>
      )}
    </svg>
  )
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
          api.get<VoteState>(`/trips/${params.tripId}/votes/${t.type}`)
        )
      )
      const tallies: Record<string, Record<string, number>> = {}
      VOTE_TOPICS.forEach((t, i) => {
        const r = tallyResults[i]
        tallies[t.type] = r.status === "fulfilled" ? tallyOf(r.value) : {}
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)] px-6">
        {error ? (
          <div className="alert-plate max-w-md w-full">
            <p className="m-label" style={{ color: "var(--accent)" }}>
              Signal lost
            </p>
            <p className="mt-2 text-sm" style={{ fontFamily: "var(--body)" }}>
              {error}
            </p>
          </div>
        ) : (
          <div className="w-full max-w-md">
            <p className="m-label mb-3">Plotting the route…</p>
            <div className="skeleton-hatch h-4 w-full mb-2" />
            <div className="skeleton-hatch h-4 w-4/5 mb-2" />
            <div className="skeleton-hatch h-4 w-2/3" />
          </div>
        )}
      </div>
    )
  }

  const taskTodo =
    (summary.tasks.by_status.todo ?? 0) +
    (summary.tasks.by_status.in_progress ?? 0)
  const taskDone = summary.tasks.by_status.done ?? 0
  const snapshot = summary.preference_snapshot

  return (
    <AppShell
      tripId={params.tripId}
      active="dashboard"
      title={title}
      subtitle={`${summary.trip.destination ?? "Destination TBD"} · ${summary.trip.trip_type}`}
    >
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="grid gap-6">
          {/* ── Expedition readings — hard-ruled stat plates ── */}
          <div className="plates trio animate-fade-up" style={{ marginBottom: 0 }}>
            <div className="plate" style={{ gap: 8 }}>
              <p className="plate-no">
                <span>Bearings</span>
                <span className="tick">◆</span>
              </p>
              <p
                className="text-4xl mt-1"
                style={{ fontFamily: "var(--serif)", fontWeight: 600 }}
              >
                {summary.preferences_responded}
                <span style={{ color: "var(--ink-40)" }}>/{summary.members_total}</span>
              </p>
              <p className="m-label">Preferences in</p>
            </div>
            <div className="plate" style={{ gap: 8 }}>
              <p className="plate-no">
                <span>Manifest</span>
                <span className="tick">◆</span>
              </p>
              <p
                className="text-4xl mt-1"
                style={{ fontFamily: "var(--serif)", fontWeight: 600 }}
              >
                {summary.tasks.total}
              </p>
              <p className="m-label">
                {taskTodo} active · {taskDone} done
              </p>
            </div>
            <div className="plate" style={{ gap: 8 }}>
              <p className="plate-no">
                <span>Live wire</span>
                <span className="tick" style={lastEvent ? undefined : { color: "var(--ink-40)" }}>
                  ●
                </span>
              </p>
              <p
                className="text-lg mt-2 truncate"
                style={{ fontFamily: "var(--mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}
              >
                {lastEvent || "—"}
              </p>
              <p className="m-label">Latest signal</p>
            </div>
          </div>

          {/* ── FIG. 1 — the Surfacer as terrain ── */}
          <div className="card p-5 md:p-6 animate-fade-up">
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
              <span className="fig-tag">
                <b>FIG. 1</b> THE TERRAIN BETWEEN YOU
              </span>
              <span className="m-label">Surfacer · Claude</span>
            </div>
            <SurfacerTerrain
              snapshot={snapshot}
              destination={summary.trip.destination}
              respondedLabel={`${summary.preferences_responded}/${summary.members_total} BEARINGS IN`}
            />
            {(snapshot.gap_flags.length > 0 || snapshot.dietary_union.length > 0) && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTop: "1px dashed var(--ink-15)" }}>
                {snapshot.gap_flags.map((flag) => (
                  <span key={flag} className="chip hot">
                    ⚑ {flag}
                  </span>
                ))}
                {snapshot.dietary_union.map((tag) => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <a
              className="cta-ghost mt-4"
              href={`/trips/${params.tripId}/preferences/summary`}
            >
              Full anonymous breakdown →
            </a>
          </div>

          {/* ── № 02 — Group decisions ── */}
          <div className="card p-5 md:p-6 animate-fade-up">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <h2 className="text-2xl" style={{ fontFamily: "var(--serif)", fontWeight: 600 }}>
                Group decisions
              </h2>
              <a className="cta sm" href={`/trips/${params.tripId}/vote`}>
                Open voting <span className="arrow" aria-hidden="true">→</span>
              </a>
            </div>
            <ul>
              {VOTE_TOPICS.map((topic) => {
                const tally = voteTallies[topic.type] ?? {}
                const entries = Object.entries(tally)
                const totalVotes = entries.reduce((s, [, c]) => s + c, 0)
                const topOption = entries.sort((a, b) => b[1] - a[1])[0]
                return (
                  <li
                    key={topic.type}
                    className="flex flex-wrap items-baseline justify-between gap-2 py-3"
                    style={{ borderTop: "1px dashed var(--ink-15)" }}
                  >
                    <span className="text-[15px] font-medium" style={{ fontFamily: "var(--body)" }}>
                      {topic.label}
                    </span>
                    {totalVotes === 0 ? (
                      <span className="m-label">Unresolved</span>
                    ) : (
                      <span className="m-label">
                        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                        {topOption ? (
                          <>
                            {" · leading: "}
                            <b>{topOption[0]}</b>
                          </>
                        ) : null}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          {/* ── Destination intel ── */}
          {placeId && (
            <div className="card p-5 md:p-6 animate-fade-up">
              <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
                <h2 className="text-2xl" style={{ fontFamily: "var(--serif)", fontWeight: 600 }}>
                  Destination intel
                </h2>
                <span className="m-label">Surveyed ground</span>
              </div>
              <PlaceCard placeId={placeId} />
            </div>
          )}

          {/* ── Itinerary preview ── */}
          <div className="card p-5 md:p-6 animate-fade-up">
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
              <h2 className="text-2xl" style={{ fontFamily: "var(--serif)", fontWeight: 600 }}>
                The route so far
              </h2>
              <span className="m-label">Days 1–2</span>
            </div>
            {summary.itinerary_preview.length === 0 ? (
              <p className="text-sm py-2" style={{ color: "var(--ink-60)", fontFamily: "var(--body)" }}>
                Nothing charted yet — the route is still being drawn.
              </p>
            ) : (
              <ul>
                {summary.itinerary_preview.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-baseline gap-4 py-3"
                    style={{ borderTop: "1px dashed var(--ink-15)" }}
                  >
                    <span className="m-label shrink-0" style={{ color: "var(--accent)", fontWeight: 700 }}>
                      Day {it.day_number}
                    </span>
                    <span className="text-[15px]" style={{ fontFamily: "var(--body)" }}>
                      {it.title}
                      {it.location ? (
                        <span style={{ color: "var(--ink-60)" }}> · {it.location}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <a className="cta-ghost mt-3" href={`/trips/${params.tripId}/itinerary`}>
              Open itinerary builder →
            </a>
          </div>

          {/* ── Chart index — quick links ── */}
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { no: "Plate I", label: "Preferences", title: "Anonymous breakdown", href: `/trips/${params.tripId}/preferences/summary` },
              { no: "Plate II", label: "Tasks", title: "Assign & track", href: `/trips/${params.tripId}/tasks` },
              { no: "Plate III", label: "Expenses", title: "The ledger", href: `/trips/${params.tripId}/expenses` },
              { no: "Plate IV", label: "Itinerary", title: "Day by day", href: `/trips/${params.tripId}/itinerary` },
            ].map((tile) => (
              <a key={tile.no} className="card card-interactive p-5 animate-fade-up" href={tile.href}>
                <p className="plate-no">
                  <span>{tile.no} — {tile.label}</span>
                  <span className="tick">◆</span>
                </p>
                <p className="text-xl mt-2" style={{ fontFamily: "var(--serif)", fontWeight: 600 }}>
                  {tile.title} <span style={{ color: "var(--accent)" }}>→</span>
                </p>
              </a>
            ))}
          </div>
        </div>

        {/* ── Right rail ── */}
        <div className="grid gap-4 content-start">
          {/* Party manifest */}
          <div className="card p-5 animate-fade-up">
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
              <h2 className="text-2xl" style={{ fontFamily: "var(--serif)", fontWeight: 600 }}>
                The party
              </h2>
              <span className="m-label">
                <b>{members.length}</b> aboard
              </span>
            </div>
            <ul>
              {members.map((m) => (
                <li
                  key={m.user.id}
                  className="flex items-center justify-between gap-2 py-3"
                  style={{ borderTop: "1px dashed var(--ink-15)" }}
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium truncate" style={{ fontFamily: "var(--body)" }}>
                      {m.user.name}
                    </p>
                    <p className="m-label mt-0.5">
                      {m.role === "organizer" ? <b>Leader</b> : "Member"}
                      {m.is_creator ? " · founder" : ""}
                    </p>
                  </div>
                  <span
                    className="m-label shrink-0"
                    style={m.preference_submitted ? { color: "var(--accent)", fontWeight: 700 } : { color: "var(--ink-40)" }}
                    title={m.preference_submitted ? "Preferences submitted" : "Awaiting preferences"}
                  >
                    {m.preference_submitted ? "◆ IN" : "○ DUE"}
                  </span>
                </li>
              ))}
            </ul>
            {isOrganizer && members.length > 1 && (
              <div className="pt-3 mt-1 space-y-2" style={{ borderTop: "2px solid var(--ink)" }}>
                <p className="field-label">Transfer leader role</p>
                <select
                  className="field-select"
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
                  className="cta sm w-full"
                  disabled={!transferTo}
                  onClick={transferLeadership}
                >
                  Transfer leadership
                </button>
                {transferMsg && <p className="m-label">{transferMsg}</p>}
              </div>
            )}
          </div>

          {/* Signals */}
          <div className="card p-5 animate-fade-up">
            <p className="plate-no">
              <span>Signals</span>
              <span className="tick">●</span>
            </p>
            <p className="text-xl mt-2 mb-4" style={{ fontFamily: "var(--serif)", fontWeight: 600 }}>
              Push alerts for the party
            </p>
            <button className="cta sm w-full" onClick={enablePush}>
              Enable notifications
            </button>
            {pushStatus && <p className="m-label mt-3">{pushStatus}</p>}
          </div>

          {/* Invitation */}
          <div className="card p-5 animate-fade-up">
            <p className="plate-no">
              <span>Muster</span>
              <span className="tick">◆</span>
            </p>
            <p className="text-xl mt-2 mb-4" style={{ fontFamily: "var(--serif)", fontWeight: 600 }}>
              Extend the invitation
            </p>
            <a className="cta-ghost w-full" href={`/trips/${params.tripId}/join`}>
              Open invite flow →
            </a>
          </div>

          {/* Survey nudge */}
          {!me?.preference_submitted && (
            <div className="alert-plate animate-fade-up">
              <p className="m-label" style={{ color: "var(--accent)", fontWeight: 700 }}>
                ⚑ Bearings due
              </p>
              <p className="text-sm mt-2" style={{ fontFamily: "var(--body)" }}>
                Complete your preference survey to unlock tasks, itinerary editing, and expenses.
              </p>
              <a className="cta sm mt-3" href={`/trips/${params.tripId}/preferences`}>
                Go to survey <span className="arrow" aria-hidden="true">→</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
