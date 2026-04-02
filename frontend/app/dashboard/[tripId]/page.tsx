"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { connectTripStream } from "@/lib/sse"
import { subscribeToPush } from "@/lib/pwa"
import AppShell from "@/components/AppShell"

type Trip = {
  id: string
  name: string
  destination: string | null
  start_date: string | null
  end_date: string | null
  trip_type: string
  status: string
  created_by: string
}

export default function DashboardPage() {
  const params = useParams<{ tripId: string }>()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [memberCount, setMemberCount] = useState(0)
  const [preferencesCount, setPreferencesCount] = useState(0)
  const [lastEvent, setLastEvent] = useState("")
  const [pushStatus, setPushStatus] = useState<string | null>(null)

  useEffect(() => {
    api.get<Trip>(`/trips/${params.tripId}`).then(setTrip)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    api.get<any[]>(`/trips/${params.tripId}/members`).then((members) => {
      setMemberCount(members.length)
      setPreferencesCount(members.filter((m) => m.preference_submitted).length)
    })
  }, [params.tripId])

  useEffect(() => {
    const disconnect = connectTripStream(params.tripId, (event) => {
      setLastEvent(event.type)
      if (event.type === "member_joined") setMemberCount((c) => c + 1)
      if (event.type === "preference_submitted")
        setPreferencesCount(event.data.count_responded)
    })
    return disconnect
  }, [params.tripId])

  const title = useMemo(() => trip?.name ?? "Trip dashboard", [trip])

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

  return (
    <AppShell
      tripId={params.tripId}
      active="dashboard"
      title={title}
      subtitle={`${trip?.destination ?? "Destination TBD"} · ${trip?.trip_type ?? "leisure"}`}
    >
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="grid gap-6">
          <div className="card p-6 bg-gradient-to-br from-[var(--accent-coral)] to-[var(--accent-pink)] text-white">
            <div className="flex items-center justify-between">
              <p className="text-sm/80">Group alignment</p>
              <span className="chip bg-white/20 text-white">Live</span>
            </div>
            <p className="text-3xl font-semibold mt-3">{preferencesCount}</p>
            <p className="text-sm/80">Preferences submitted</p>
            <div className="mt-6 flex gap-6 text-xs/80">
              <div>
                <p>Members</p>
                <p className="text-lg font-semibold">{memberCount}</p>
              </div>
              <div>
                <p>Latest event</p>
                <p className="text-lg font-semibold">{lastEvent || "—"}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <a className="card p-5" href={`/trips/${params.tripId}/preferences/summary`}>
              <p className="text-sm text-[var(--muted)]">Preferences</p>
              <p className="text-lg font-semibold mt-1">View summary</p>
              <p className="text-xs text-[var(--muted)] mt-2">Budget overlap + constraints</p>
            </a>
            <a className="card p-5" href={`/trips/${params.tripId}/tasks`}>
              <p className="text-sm text-[var(--muted)]">Tasks</p>
              <p className="text-lg font-semibold mt-1">Assign & track</p>
              <p className="text-xs text-[var(--muted)] mt-2">Distribute planning load</p>
            </a>
            <a className="card p-5" href={`/trips/${params.tripId}/expenses`}>
              <p className="text-sm text-[var(--muted)]">Expenses</p>
              <p className="text-lg font-semibold mt-1">Track spend</p>
              <p className="text-xs text-[var(--muted)] mt-2">Auto settlement ready</p>
            </a>
            <a className="card p-5" href={`/trips/${params.tripId}/itinerary`}>
              <p className="text-sm text-[var(--muted)]">Itinerary</p>
              <p className="text-lg font-semibold mt-1">Day plan</p>
              <p className="text-xs text-[var(--muted)] mt-2">Shared schedule</p>
            </a>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="card p-5">
            <p className="text-sm text-[var(--muted)]">Notifications</p>
            <p className="text-lg font-semibold mt-1">Enable alerts</p>
            <p className="text-xs text-[var(--muted)] mt-2">
              Get nudges for task assignments and updates.
            </p>
            <button
              className="mt-4 rounded-full bg-[var(--ink)] text-white px-4 py-2 text-sm"
              onClick={enablePush}
            >
              Enable
            </button>
            {pushStatus && (
              <p className="text-xs text-[var(--muted)] mt-2">{pushStatus}</p>
            )}
          </div>
          <div className="card p-5">
            <p className="text-sm text-[var(--muted)]">Next step</p>
            <p className="text-lg font-semibold mt-1">Invite members</p>
            <p className="text-xs text-[var(--muted)] mt-2">
              Share the invite link to collect preferences faster.
            </p>
            <a
              className="mt-4 inline-block rounded-full border border-black/10 px-4 py-2 text-sm"
              href={`/trips/${params.tripId}/join`}
            >
              Open invite link
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
