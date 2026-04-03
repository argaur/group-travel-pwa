"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { ensureBackendToken } from "@/lib/backend-auth"

type TripCard = {
  id: string
  name: string
  destination: string | null
  start_date: string | null
  end_date: string | null
  trip_type: string
  status: string
}

export default function DashboardLandingPage() {
  const router = useRouter()
  const { status } = useSession()
  const [trips, setTrips] = useState<TripCard[] | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/dashboard")
    }
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    let cancelled = false
    ;(async () => {
      try {
        await ensureBackendToken()
        const data = await api.get<TripCard[]>("/trips")
        if (!cancelled) setTrips(data)
      } catch {
        if (!cancelled) setTrips([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [status])

  if (status === "unauthenticated" || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Dashboard</p>
          <h1 className="text-4xl md:text-5xl font-semibold">Your trips</h1>
          <p className="text-sm text-[var(--muted)]">
            Open a trip hub or create a new one. Invite links look like{" "}
            <code className="rounded bg-black/5 px-1 py-0.5 text-xs">
              /trips/&lt;id&gt;/join?token=…
            </code>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/trips/new"
            className="rounded-full bg-[var(--ink)] text-white px-6 py-3 text-sm font-semibold text-center"
          >
            Plan a new trip
          </Link>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Recent workspaces</h2>
          {trips === null && (
            <p className="text-sm text-[var(--muted)]">Loading trips…</p>
          )}
          {trips && trips.length === 0 && (
            <p className="text-sm text-[var(--muted)]">
              No trips yet — create one to see it here.
            </p>
          )}
          {trips && trips.length > 0 && (
            <ul className="space-y-2">
              {trips.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/dashboard/${t.id}`}
                    className="block card p-4 hover:border-black/20 transition-colors"
                  >
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {t.destination ?? "Destination TBD"} · {t.trip_type} · {t.status}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
