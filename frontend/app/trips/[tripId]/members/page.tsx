"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { ensureBackendToken, getBackendUserId } from "@/lib/backend-auth"
import { connectTripStream } from "@/lib/sse"
import AppShell from "@/components/AppShell"
import MemberRoster from "@/components/members/MemberRoster"

type MemberRow = {
  user: { id: string; name: string; avatar_url: string | null }
  role: string
  is_creator: boolean
  preference_submitted: boolean
  rsvp_status?: "going" | "maybe" | "declined" | "pending"
  rsvp_updated_at?: string | null
}

type RSVPRow = {
  user_id: string
  rsvp_status: "going" | "maybe" | "declined" | "pending"
  rsvp_updated_at: string | null
}

export default function MembersPage() {
  const params = useParams<{ tripId: string }>()
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loading, setLoading] = useState(true)

  const myId = getBackendUserId()
  const me = members.find((m) => m.user.id === myId)
  const isOrganizer = me?.role === "organizer"

  const load = useCallback(async () => {
    await ensureBackendToken()
    const [mems, rsvps] = await Promise.all([
      api.get<MemberRow[]>(`/trips/${params.tripId}/members`),
      api
        .get<RSVPRow[]>(`/trips/${params.tripId}/rsvp`)
        .catch(() => [] as RSVPRow[]),
    ])

    // Merge RSVP data into members
    const rsvpMap: Record<string, RSVPRow> = {}
    rsvps.forEach((r) => { rsvpMap[r.user_id] = r })

    const merged = mems.map((m) => ({
      ...m,
      rsvp_status: rsvpMap[m.user.id]?.rsvp_status ?? "pending",
      rsvp_updated_at: rsvpMap[m.user.id]?.rsvp_updated_at ?? null,
    }))

    setMembers(merged)
    setLoading(false)
  }, [params.tripId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const disconnect = connectTripStream(params.tripId, (event) => {
      if (
        event.type === "member_joined" ||
        event.type === "rsvp_updated" ||
        event.type === "preference_submitted" ||
        event.type === "leader_transferred"
      ) {
        load().catch(() => {})
      }
    })
    return disconnect
  }, [params.tripId, load])

  return (
    <AppShell
      tripId={params.tripId}
      active="members"
      title="Group members"
      subtitle={`${members.length} people · tap a filter to narrow down`}
    >
      {loading ? (
        <div className="max-w-md py-6">
          <p className="m-label mb-3">Plotting the party…</p>
          <div className="skeleton-hatch h-4 w-full mb-2" />
          <div className="skeleton-hatch h-4 w-4/5" />
        </div>
      ) : (
        <div className="max-w-2xl">
          <MemberRoster
            members={members}
            myId={myId}
            isOrganizer={isOrganizer}
            tripId={params.tripId}
            onTransfer={load}
          />
        </div>
      )}
    </AppShell>
  )
}
