import Link from "next/link"

type AppShellProps = {
  tripId: string
  active: "dashboard" | "tasks" | "expenses" | "itinerary" | "preferences"
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
    { id: "tasks", label: "Tasks", href: `/trips/${tripId}/tasks` },
    { id: "expenses", label: "Expenses", href: `/trips/${tripId}/expenses` },
    { id: "itinerary", label: "Itinerary", href: `/trips/${tripId}/itinerary` },
  ]

  return (
    <div className="min-h-screen flex">
      <aside className="w-20 md:w-56 bg-[var(--nav)] text-white flex flex-col items-center md:items-start px-4 py-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--accent-coral)] to-[var(--accent-pink)] mb-8" />
        <nav className="flex flex-col gap-2 w-full">
          {nav.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-full text-sm ${
                active === item.id ? "bg-[var(--nav-accent)]" : "text-white/70"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white/80" />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 px-6 md:px-10 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{title}</h1>
              {subtitle && <p className="text-sm text-[var(--muted)]">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-black/5">
                <span className="text-xs text-[var(--muted)]">Search</span>
              </div>
              <Link
                href="/trips/new"
                className="rounded-full bg-[var(--ink)] text-white px-4 py-2 text-sm"
              >
                New Trip
              </Link>
            </div>
          </div>

          {children}
        </div>
      </main>
    </div>
  )
}
