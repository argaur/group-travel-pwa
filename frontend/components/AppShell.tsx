"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { api } from "@/lib/api"
import { Contours } from "@/components/Contours"

type TripMeta = {
  name: string
  destination: string | null
  start_date: string | null
  end_date: string | null
  place_name: string | null
  trip_type: string
  status: string
}

type AppShellProps = {
  tripId: string
  active: "dashboard" | "tasks" | "expenses" | "itinerary" | "preferences" | "vote" | "members" | "rsvp"
  title: string
  subtitle?: string
  children: React.ReactNode
}

/* Compass-rose wordmark — the Trivo mark (mirrors LandingPage's TrivoMark) */
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
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })
  if (start && end) return `${fmt(start)} – ${fmt(end)}`
  if (start) return `From ${fmt(start)}`
  return `Until ${fmt(end!)}`
}

export default function AppShell({
  tripId,
  active,
  title,
  subtitle,
  children,
}: AppShellProps) {
  const [tripMeta, setTripMeta] = useState<TripMeta | null>(null)

  useEffect(() => {
    api.get<TripMeta>(`/trips/${tripId}`).then(setTripMeta).catch(() => {})
  }, [tripId])
  const nav = [
    { id: "dashboard", label: "Dashboard", href: `/dashboard/${tripId}` },
    { id: "preferences", label: "Preferences", href: `/trips/${tripId}/preferences/summary` },
    { id: "vote", label: "Decisions", href: `/trips/${tripId}/vote` },
    { id: "rsvp", label: "RSVP", href: `/trips/${tripId}/rsvp` },
    { id: "members", label: "Members", href: `/trips/${tripId}/members` },
    { id: "tasks", label: "Tasks", href: `/trips/${tripId}/tasks` },
    { id: "expenses", label: "Expenses", href: `/trips/${tripId}/expenses` },
    { id: "itinerary", label: "Itinerary", href: `/trips/${tripId}/itinerary` },
  ]

  return (
    <div className="min-h-screen flex">
      {/* ── Sidebar — the field-kit rail ── */}
      <aside
        className="w-16 md:w-56 flex flex-col shrink-0"
        style={{ background: "var(--ink)", color: "var(--paper)", borderRight: "2px solid #000" }}
      >
        {/* Wordmark */}
        <Link
          href="/"
          aria-label="Trivo home"
          className="flex items-center justify-center md:justify-start gap-3 px-3 md:px-5 py-5"
          style={{ borderBottom: "1px solid rgba(242,235,219,0.14)", color: "var(--paper)" }}
        >
          <TrivoMark />
          <span
            className="hidden md:inline"
            style={{
              fontFamily: "var(--mono)",
              fontSize: "13px",
              letterSpacing: "0.34em",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Trivo
          </span>
        </Link>

        {/* Nav items */}
        <nav className="flex flex-col gap-0.5 px-2 py-4 flex-1" aria-label="Trip sections">
          {nav.map((item, i) => {
            const isActive = active === item.id
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className="relative flex items-center gap-3 px-3 py-2.5 transition-colors duration-150"
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? "var(--nav-accent)" : "transparent",
                  color: isActive ? "var(--paper)" : "rgba(242,235,219,0.5)",
                  borderLeft: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                }}
              >
                <span
                  className="hidden md:inline"
                  style={{ fontSize: "10px", color: "var(--accent)", fontWeight: 700, width: 20 }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="hidden md:inline">{item.label}</span>
                {/* Mobile: vermillion dot for active, faint tick otherwise */}
                <span
                  className="md:hidden mx-auto"
                  style={{
                    width: 7,
                    height: 7,
                    background: isActive ? "var(--accent)" : "rgba(242,235,219,0.3)",
                  }}
                />
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 md:px-5 py-4" style={{ borderTop: "1px solid rgba(242,235,219,0.14)" }}>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="hidden md:block transition-colors"
            style={{
              fontFamily: "var(--mono)",
              fontSize: "10px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(242,235,219,0.4)",
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="relative flex-1 overflow-hidden min-w-0 flex flex-col">
        {/* Trip context bar — a coordinate strip */}
        {tripMeta && (
          <div
            className="shrink-0 px-5 md:px-10 h-11 flex items-center gap-3 overflow-hidden"
            style={{
              background: "var(--ink)",
              borderBottom: "1px solid rgba(242,235,219,0.14)",
              fontFamily: "var(--mono)",
              textTransform: "uppercase",
            }}
          >
            <span style={{ color: "var(--accent)", fontSize: "10px", letterSpacing: "0.22em", fontWeight: 700 }}>
              ◆
            </span>
            <span
              className="truncate min-w-0 shrink"
              style={{ color: "var(--paper)", fontSize: "11px", letterSpacing: "0.18em", fontWeight: 500 }}
            >
              {tripMeta.place_name ?? tripMeta.destination ?? tripMeta.name}
            </span>

            <span className="shrink-0" style={{ color: "rgba(242,235,219,0.25)" }}>·</span>

            <span
              className="shrink-0"
              style={{
                fontSize: "10px",
                letterSpacing: "0.2em",
                color: formatDateRange(tripMeta.start_date, tripMeta.end_date)
                  ? "rgba(242,235,219,0.55)"
                  : "rgba(242,235,219,0.3)",
              }}
            >
              {formatDateRange(tripMeta.start_date, tripMeta.end_date) ?? "Dates TBD"}
            </span>

            <span className="shrink-0" style={{ color: "rgba(242,235,219,0.25)" }}>·</span>

            <span
              className="shrink-0"
              style={{ fontSize: "10px", letterSpacing: "0.24em", color: "rgba(242,235,219,0.4)" }}
            >
              {tripMeta.status}
            </span>
          </div>
        )}

        <div className="relative flex-1 px-5 md:px-10 py-8 overflow-hidden">
          {/* Terrain backdrop */}
          <Contours fixed />

          {/* Page content */}
          <div className="relative flex flex-col gap-6 animate-fade-up">
            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <span className="fig-tag" style={{ marginBottom: 12 }}>
                  <b>◆</b> {active}
                </span>
                <h1
                  className="text-[28px] md:text-[36px] leading-tight mt-2"
                  style={{ fontFamily: "var(--serif)", fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}
                >
                  {title}
                </h1>
                {subtitle && (
                  <p className="m-label mt-1.5">
                    {subtitle}
                  </p>
                )}
              </div>
              <Link href="/trips/new" className="cta sm self-start md:self-auto">
                New trip <span className="arrow" aria-hidden="true">→</span>
              </Link>
            </div>

            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
