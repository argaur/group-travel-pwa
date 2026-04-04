"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
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
  place_name?: string | null
  place_photo_url?: string | null
}

const TYPE_ACCENT: Record<string, string> = {
  leisure: "var(--accent-lilac)",
  adventure: "var(--accent-coral)",
  beach: "var(--accent-pink)",
  mountain: "var(--accent-lilac)",
  family: "var(--accent-coral)",
  office: "var(--muted)",
}

function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) return null
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
  if (start && end) return `${fmt(start)} – ${fmt(end)}`
  if (start) return `From ${fmt(start)}`
  return `Until ${fmt(end!)}`
}

export default function DashboardLandingPage() {
  const router = useRouter()
  const { status, data: session } = useSession()
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
    return () => { cancelled = true }
  }, [status])

  if (status === "unauthenticated" || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[13px] text-[var(--muted)]" style={{ fontFamily: "var(--font-body)" }}>
          Loading…
        </p>
      </div>
    )
  }

  const userName = session?.user?.name?.split(" ")[0] ?? "there"

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Top bar */}
      <header className="border-b border-[var(--line)] px-6 py-4 flex items-center justify-between">
        <p
          className="text-[20px] text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300 }}
        >
          GroupTrip
        </p>
        <button
          type="button"
          className="text-[12px] text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          style={{ fontFamily: "var(--font-body)" }}
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Sign out
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Welcome header */}
        <div className="mb-10 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p
              className="text-[12px] uppercase tracking-widest text-[var(--muted)] mb-2"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Welcome back
            </p>
            <h1
              className="text-[42px] leading-tight text-[var(--ink)]"
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 300,
              }}
            >
              {userName}.
            </h1>
          </div>

          <Link
            href="/trips/new"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-[4px] bg-[var(--ink)] text-white text-[13px] font-medium hover:opacity-90 transition-opacity shrink-0"
            style={{ fontFamily: "var(--font-body)" }}
          >
            <span className="text-[16px] leading-none">+</span>
            Plan new trip
          </Link>
        </div>

        {/* Trip grid */}
        {trips === null ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="border border-[var(--line)] rounded-[4px] overflow-hidden animate-pulse"
              >
                <div className="h-32 bg-[var(--line)]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-[var(--line)] rounded w-3/4" />
                  <div className="h-3 bg-[var(--line)] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div
            className="border border-dashed border-[var(--line)] rounded-[4px] px-8 py-16 text-center space-y-4"
          >
            <p
              className="text-[28px] text-[var(--ink)]"
              style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300 }}
            >
              No trips yet.
            </p>
            <p
              className="text-[14px] text-[var(--muted)]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Create your first trip and invite the group in minutes.
            </p>
            <Link
              href="/trips/new"
              className="inline-block mt-2 h-10 px-6 rounded-[4px] bg-[var(--ink)] text-white text-[13px] font-medium"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Plan a trip
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {trips.map((t) => {
              const accent = TYPE_ACCENT[t.trip_type] ?? "var(--accent-lilac)"
              const dateRange = formatDateRange(t.start_date, t.end_date)
              return (
                <Link
                  key={t.id}
                  href={`/dashboard/${t.id}`}
                  className="block border border-[var(--line)] rounded-[4px] overflow-hidden hover:border-[var(--ink)]/30 transition-colors group"
                >
                  {/* Photo / accent header */}
                  <div
                    className="h-28 relative overflow-hidden"
                    style={{
                      background: t.place_photo_url
                        ? undefined
                        : `linear-gradient(135deg, ${accent}20 0%, ${accent}08 100%)`,
                    }}
                  >
                    {t.place_photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.place_photo_url}
                        alt={t.place_name ?? t.destination ?? ""}
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-80 transition-opacity"
                      />
                    )}
                    <div
                      className="absolute top-3 left-3 w-1 h-5 rounded-full"
                      style={{ background: accent }}
                    />
                    <div
                      className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full border"
                      style={{
                        fontFamily: "var(--font-body)",
                        background: "rgba(246,242,237,0.85)",
                        borderColor: "var(--line)",
                        color: "var(--muted)",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {t.status}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-1.5">
                    <p
                      className="text-[15px] font-medium text-[var(--ink)] leading-snug"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {t.name}
                    </p>
                    <p
                      className="text-[12px] text-[var(--muted)]"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {t.place_name ?? t.destination ?? "Destination TBD"}
                      {dateRange ? ` · ${dateRange}` : ""}
                    </p>
                    <p
                      className="text-[11px] uppercase tracking-wider"
                      style={{ fontFamily: "var(--font-body)", color: accent }}
                    >
                      {t.trip_type}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
