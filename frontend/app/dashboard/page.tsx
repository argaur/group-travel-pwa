import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

export default async function DashboardLandingPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center space-y-5">
        <p className="text-xs uppercase tracking-[0.4em] text-[var(--muted)]">Dashboard</p>
        <h1 className="text-4xl md:text-5xl font-semibold">Welcome back</h1>
        <p className="text-sm text-[var(--muted)]">Create a trip, open an invite link, or paste a previously shared dashboard URL to pick up where you left off.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/trips/new"
            className="rounded-full bg-[var(--ink)] text-white px-6 py-3 text-sm font-semibold"
          >
            Plan a new trip
          </Link>
          <Link
            href="/auth/signin?callbackUrl=/dashboard"
            className="rounded-full border border-black/10 px-6 py-3 text-sm font-semibold"
          >
            Use an invite link
          </Link>
        </div>
        <p className="text-xs text-[var(--muted)]">Tip: Invite links look like <code className="rounded bg-black/5 px-1 py-0.5">/trips/abc123/join?token=xyz</code>. Open the exact URL you received to land on the correct trip dashboard.</p>
      </div>
    </div>
  )
}
