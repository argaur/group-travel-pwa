"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"

type AppShellProps = {
  tripId: string
  active: "dashboard" | "tasks" | "expenses" | "itinerary" | "preferences" | "vote" | "members" | "rsvp"
  title: string
  subtitle?: string
  children: React.ReactNode
}

export default function AppShell({
  tripId,
  active,
  title,
  subtitle,
  children,
}: AppShellProps) {
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
            className="hidden md:block text-white text-[17px] leading-tight"
            style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 500 }}
          >
            GroupTrip
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
      <main className="relative flex-1 px-5 md:px-10 py-8 overflow-hidden min-w-0">
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
      </main>
    </div>
  )
}
