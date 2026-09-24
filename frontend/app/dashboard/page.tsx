"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { ensureBackendToken } from "@/lib/backend-auth"
import { Contours } from "@/components/Contours"

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

/* Compass-rose wordmark — the Trivo mark */
function TrivoMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true" className="shrink-0">
      <circle cx="11" cy="11" r="9.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M11 3.4 L13 11 L11 18.6 L9 11 Z" fill="var(--accent)" />
      <circle cx="11" cy="11" r="1.5" fill="currentColor" />
    </svg>
  )
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
  const [loadFailed, setLoadFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/dashboard")
    }
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    let cancelled = false
    setLoadFailed(false)
    setTrips(null)
    ;(async () => {
      try {
        await ensureBackendToken()
        const data = await api.get<TripCard[]>("/trips")
        if (!cancelled) setTrips(data)
      } catch (err) {
        // Keep "failed to load" distinct from "no trips": an empty list would tell the user their trips are gone.
        console.error("[dashboard] could not load trips", err)
        if (!cancelled) setLoadFailed(true)
      }
    })()
    return () => { cancelled = true }
  }, [status, attempt])

  if (status === "unauthenticated" || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--paper)" }}>
        <p className="m-label">Plotting the route…</p>
      </div>
    )
  }

  const userName = session?.user?.name?.split(" ")[0] ?? "there"

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--paper)" }}>
      <Contours fixed />

      {/* Top bar — field-guide header */}
      <header
        className="px-6 py-4 flex items-center justify-between relative z-10"
        style={{ borderBottom: "2px solid var(--ink)", background: "var(--paper)" }}
      >
        <Link
          href="/"
          className="flex items-center gap-3"
          style={{
            fontFamily: "var(--mono)",
            fontSize: 15,
            letterSpacing: "0.34em",
            fontWeight: 700,
            textTransform: "uppercase",
            color: "var(--ink)",
          }}
        >
          <TrivoMark />
          Trivo
        </Link>
        <button
          type="button"
          className="transition-colors"
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--ink-60)",
          }}
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Sign out
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12 relative z-10">
        {/* Welcome header */}
        <div className="mb-10 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <span className="fig-tag" style={{ marginBottom: 14 }}>
              <b>◆</b> Welcome back
            </span>
            <h1
              className="text-[42px] leading-tight mt-3"
              style={{ fontFamily: "var(--serif)", fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}
            >
              {userName}<span style={{ color: "var(--accent)" }}>.</span>
            </h1>
          </div>

          <Link href="/trips/new" className="cta sm shrink-0">
            Plan new trip <span className="arrow" aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Trip grid */}
        {loadFailed ? (
          <div
            className="px-8 py-16 text-center"
            role="alert"
            style={{ border: "2px dashed var(--accent)", background: "var(--paper)" }}
          >
            <p className="text-[28px]" style={{ fontFamily: "var(--serif)", fontWeight: 600, color: "var(--ink)" }}>
              Couldn&apos;t load your trips.
            </p>
            <p className="text-[14px] mt-3 mb-6" style={{ fontFamily: "var(--body)", color: "var(--ink-60)" }}>
              Your trips are safe. The server didn&apos;t answer in time.
            </p>
            <button type="button" className="cta sm inline-flex" onClick={() => setAttempt((n) => n + 1)}>
              Try again <span className="arrow" aria-hidden="true">→</span>
            </button>
          </div>
        ) : trips === null ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="card flat overflow-hidden">
                <div className="skeleton-hatch h-28 w-full" />
                <div className="p-4 space-y-2">
                  <div className="skeleton-hatch h-4 w-3/4" />
                  <div className="skeleton-hatch h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div
            className="px-8 py-16 text-center"
            style={{ border: "2px dashed var(--ink-15)", background: "var(--paper)" }}
          >
            <p
              className="text-[28px]"
              style={{ fontFamily: "var(--serif)", fontWeight: 600, color: "var(--ink)" }}
            >
              Nothing charted yet.
            </p>
            <p className="text-[14px] mt-3 mb-6" style={{ fontFamily: "var(--body)", color: "var(--ink-60)" }}>
              Raise the party and chart your first expedition in minutes.
            </p>
            <Link href="/trips/new" className="cta sm inline-flex">
              Chart a trip <span className="arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {trips.map((t, i) => {
              const dateRange = formatDateRange(t.start_date, t.end_date)
              return (
                <Link
                  key={t.id}
                  href={`/dashboard/${t.id}`}
                  className="card card-interactive flat overflow-hidden block"
                >
                  {/* Photo / grid header — real surveyed ground */}
                  <div
                    className="h-28 relative overflow-hidden"
                    style={{
                      borderBottom: "2px solid var(--ink)",
                      background: t.place_photo_url
                        ? undefined
                        : "linear-gradient(var(--ink-08) 1px, transparent 1px), linear-gradient(90deg, var(--ink-08) 1px, transparent 1px)",
                      backgroundSize: t.place_photo_url ? undefined : "20px 20px",
                    }}
                  >
                    {t.place_photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.place_photo_url}
                        alt={t.place_name ?? t.destination ?? ""}
                        className="w-full h-full object-cover"
                        style={{ filter: "saturate(0.85)" }}
                      />
                    )}
                    <span
                      className="absolute top-3 left-3"
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 10,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        color: t.place_photo_url ? "var(--paper)" : "var(--ink-40)",
                        fontWeight: 700,
                        textShadow: t.place_photo_url ? "0 1px 3px rgba(0,0,0,0.5)" : undefined,
                      }}
                    >
                      Plate {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="chip absolute top-2.5 right-3"
                      style={{ background: "var(--paper)" }}
                    >
                      {t.status}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-1.5">
                    <p
                      className="text-[18px] leading-snug"
                      style={{ fontFamily: "var(--serif)", fontWeight: 600, color: "var(--ink)" }}
                    >
                      {t.name}
                    </p>
                    <p className="m-label" style={{ letterSpacing: "0.12em" }}>
                      {t.place_name ?? t.destination ?? "Destination TBD"}
                      {dateRange ? ` · ${dateRange}` : ""}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 10.5,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        color: "var(--accent)",
                        fontWeight: 700,
                        marginTop: 4,
                      }}
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
