export default function Home() {
  return (
    <div className="min-h-screen px-8 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--accent-coral)] to-[var(--accent-pink)]" />
          <span className="text-sm tracking-widest uppercase text-[var(--muted)]">
            Group Travel
          </span>
        </div>
        <h1 className="text-5xl font-semibold mt-6 leading-tight">
          Plan trips with calm. Align budgets, preferences, and tasks in one
          place.
        </h1>
        <p className="text-base text-[var(--muted)] mt-4 max-w-2xl">
          A modern PWA for group coordination. Anonymous preference collection,
          shared tasks, and live updates keep everyone aligned without the chat
          overload.
        </p>
        <div className="mt-8 flex gap-3">
          <a
            href="/trips/new"
            className="rounded-full bg-[var(--ink)] text-white px-5 py-2"
          >
            Create a trip
          </a>
          <a
            href="/auth/signin"
            className="rounded-full border border-black/10 px-5 py-2"
          >
            Join a trip
          </a>
        </div>
      </div>
    </div>
  )
}
