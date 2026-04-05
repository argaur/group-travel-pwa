"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { api } from "@/lib/api"

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
      {/* Sidebar */}
      <aside className="w-16 md:w-56 bg-[var(--nav)] text-white flex flex-col shrink-0 border-r border-white/5">
        {/* App name */}
        <div className="px-4 py-5 border-b border-white/5">
          <span
            className="hidden md:block gradient-text text-[17px] leading-tight"
            style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 500 }}
          >
            Trivo
          </span>
          {/* Mobile: gradient square */}
          <div className="md:hidden w-8 h-8 rounded-[4px] bg-gradient-to-br from-[var(--accent-coral)] to-[var(--accent-pink)]" />
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-0.5 px-2 py-3 flex-1">
          {nav.map((item) => {
            const isActive = active === item.id
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 text-sm transition-colors duration-150 rounded-r-full ${
                  isActive
                    ? "bg-[var(--nav-accent)] text-white"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
                style={isActive ? { borderLeft: "3px solid var(--accent-lilac)", paddingLeft: "calc(0.75rem - 1px)" } : {}}
              >
                <span className="hidden md:inline font-body text-[13px] font-medium" style={{ fontFamily: "var(--font-body)" }}>
                  {item.label}
                </span>
                {/* Mobile: dot indicator */}
                <span
                  className={`md:hidden w-2 h-2 rounded-full mx-auto ${
                    isActive ? "bg-[var(--accent-pink)]" : "bg-white/30"
                  }`}
                />
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="px-4 py-4 border-t border-white/5">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="hidden md:block text-xs text-white/30 hover:text-white/60 transition-colors"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="relative flex-1 overflow-hidden min-w-0 flex flex-col">
        {/* Trip context bar */}
        {tripMeta && (
          <div
            className="shrink-0 border-b px-5 md:px-10 h-10 flex items-center gap-3 overflow-hidden"
            style={{ background: "var(--ink)", borderColor: "rgba(255,255,255,0.06)" }}
          >
            {/* Pin icon */}
            <svg width="10" height="12" viewBox="0 0 10 12" fill="none" className="shrink-0 opacity-60">
              <path d="M5 0C2.79 0 1 1.79 1 4c0 3 4 8 4 8s4-5 4-8c0-2.21-1.79-4-4-4zm0 5.5A1.5 1.5 0 1 1 5 2.5a1.5 1.5 0 0 1 0 3z" fill="white" />
            </svg>

            {/* Destination */}
            <span
              className="gradient-text text-[12px] font-medium truncate min-w-0 shrink"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {tripMeta.place_name ?? tripMeta.destination ?? tripMeta.name}
            </span>

            {/* Divider */}
            <span className="shrink-0 w-px h-3.5 opacity-20 bg-white" />

            {/* Dates */}
            {formatDateRange(tripMeta.start_date, tripMeta.end_date) ? (
              <span
                className="shrink-0 text-[11px]"
                style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.5)" }}
              >
                {formatDateRange(tripMeta.start_date, tripMeta.end_date)}
              </span>
            ) : (
              <span
                className="shrink-0 text-[11px]"
                style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.3)" }}
              >
                Dates TBD
              </span>
            )}

            {/* Divider */}
            <span className="shrink-0 w-px h-3.5 opacity-20 bg-white" />

            {/* Status */}
            <span
              className="shrink-0 text-[10px] uppercase tracking-widest"
              style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.3)" }}
            >
              {tripMeta.status}
            </span>
          </div>
        )}

        <div className="relative flex-1 px-5 md:px-10 py-8 overflow-hidden">
        {/* Background orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-100px] right-[-70px] h-72 w-72 rounded-full bg-[var(--accent-lilac)]/10 blur-3xl" />
          <div className="absolute bottom-[-110px] left-[12%] h-72 w-72 rounded-full bg-[var(--accent-coral)]/10 blur-3xl" />
        </div>

        {/* Page content */}
        <div className="relative flex flex-col gap-6 animate-fade-up">
          {/* Page header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1
                className="text-[28px] md:text-[34px] leading-tight text-[var(--ink)]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  className="text-sm text-[var(--muted)] mt-0.5"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {subtitle}
                </p>
              )}
            </div>
            <Link
              href="/trips/new"
              className="self-start md:self-auto rounded-[4px] bg-[var(--ink)] text-white px-4 py-2 text-sm transition-all duration-150 hover:opacity-90"
              style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
            >
              New Trip
            </Link>
          </div>

          {children}
        </div>
        </div>
      </main>
    </div>
  )
}
