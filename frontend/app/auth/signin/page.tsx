"use client"

import { signIn } from "next-auth/react"

export default function SignInPage() {
  const callbackUrl =
    typeof window === "undefined"
      ? "/trips/new"
      : new URLSearchParams(window.location.search).get("callbackUrl") ?? "/trips/new"

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card w-full max-w-md p-8">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--accent-coral)] to-[var(--accent-pink)] mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Welcome back</h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          Continue with Google to join your trip workspace.
        </p>
        <button
          className="w-full rounded-full bg-[var(--ink)] text-white px-4 py-2"
          onClick={() => signIn("google", { callbackUrl })}
        >
          Continue with Google
        </button>
      </div>
    </div>
  )
}
