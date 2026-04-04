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
        <p className="text-sm text-[var(--muted)]">Loading…</p>
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
            <div className="flex-1 h-px bg-[var(--line)]" />
            <a
              href={`/trips/${params.tripId}/availability`}
              className="text-[12px] text-[var(--muted)] hover:text-[var(--ink)] transition-colors whitespace-nowrap"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Mark your no-go dates →
            </a>
            <div className="flex-1 h-px bg-[var(--line)]" />
          </div>

          {/* Member grid */}
          <div className="space-y-3">
            <h2
              className="text-[22px]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
            >
              Who's coming?
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
