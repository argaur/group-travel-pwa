"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { connectTripStream } from "@/lib/sse"
import { ensureBackendToken, getBackendUserId } from "@/lib/backend-auth"
import AppShell from "@/components/AppShell"
import RSVPCard from "@/components/rsvp/RSVPCard"
import MemberRSVPGrid from "@/components/rsvp/MemberRSVPGrid"

type RSVPMember = {
  user_id: string
  name: string
  avatar_url: string | null
  role: string
  preference_submitted: boolean
  rsvp_status: string
  rsvp_updated_at: string | null
}

type TripData = {
  name: string
  destination: string | null
  start_date: string | null
  end_date: string | null
}

export default function RSVPPage() {
  const params = useParams<{ tripId: string }>()
  const [members, setMembers] = useState<RSVPMember[]>([])
  const [trip, setTrip] = useState<TripData | null>(null)
  const [loading, setLoading] = useState(true)

  const myId = getBackendUserId()

  const load = useCallback(async () => {
    await ensureBackendToken()
    const [rsvpData, tripData] = await Promise.all([
      api.get<RSVPMember[]>(`/trips/${params.tripId}/rsvp`),
      api.get<TripData>(`/trips/${params.tripId}`),
    ])
    setMembers(rsvpData)
    setTrip(tripData)
    setLoading(false)
  }, [params.tripId])

  useEffect(() => {
    load()
  }, [load])

  // Live RSVP updates via SSE
  useEffect(() => {
    const disconnect = connectTripStream(params.tripId, (event) => {
      if (event.type === "rsvp_updated") {
        // Update the specific member's status in state without full reload
        const { user_id, rsvp_status: status } = event.data
        setMembers((prev) =>
          prev.map((m) =>
            m.user_id === user_id
              ? { ...m, rsvp_status: status, rsvp_updated_at: new Date().toISOString() }
              : m,
          ),
        )
      }
    })
    return disconnect
  }, [params.tripId])

  const me = useMemo(() => members.find((m) => m.user_id === myId), [members, myId])

  function handleStatusChange(status: string) {
    if (!myId) return
    setMembers((prev) =>
      prev.map((m) =>
        m.user_id === myId
          ? { ...m, rsvp_status: status, rsvp_updated_at: new Date().toISOString() }
          : m,
      ),
    )
  }

  return (
    <AppShell
      tripId={params.tripId}
      active="rsvp"
      title="RSVP"
      subtitle={trip?.name ?? ""}
    >
      {loading ? (
        <div className="max-w-md">
          <p className="m-label mb-3">Plotting the muster…</p>
          <div className="skeleton-hatch h-4 w-full mb-2" />
          <div className="skeleton-hatch h-4 w-4/5" />
        </div>
      ) : (
        <div className="space-y-10 max-w-2xl">
          {/* My RSVP card */}
          {me && trip && (
            <RSVPCard
              tripId={params.tripId}
              tripName={trip.name}
              destination={trip.destination}
              startDate={trip.start_date}
              endDate={trip.end_date}
              currentStatus={me.rsvp_status}
              onStatusChange={handleStatusChange}
            />
          )}

          {/* Availability link */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--ink-15)" }} />
            <a href={`/trips/${params.tripId}/availability`} className="cta-ghost whitespace-nowrap">
              Mark your no-go dates →
            </a>
            <div className="flex-1 h-px" style={{ background: "var(--ink-15)" }} />
          </div>

          {/* Member grid */}
          <div className="space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="fig-tag" style={{ flexShrink: 0 }}><b>◆</b> The muster roll</span>
              <div className="flex-1 h-px" style={{ background: "var(--ink-15)" }} />
            </div>
            <h2 className="text-[24px]" style={{ fontFamily: "var(--serif)", fontWeight: 600, color: "var(--ink)" }}>
              Who&apos;s coming?
            </h2>
            <MemberRSVPGrid
              members={members}
              currentUserId={myId ?? ""}
            />
          </div>
        </div>
      )}
    </AppShell>
  )
}
