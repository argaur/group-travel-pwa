"use client"

import { useSearchParams, useRouter, useParams } from "next/navigation"
import { api } from "@/lib/api"
import { shareInviteLink } from "@/lib/pwa"
import { useState } from "react"

export default function JoinTripPage() {
  const params = useParams<{ tripId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") || ""
  const [joining, setJoining] = useState(false)

  async function onJoin() {
    if (!token) return
    setJoining(true)
    try {
      await api.post(`/trips/${params.tripId}/join`, { invite_token: token })
      router.push(`/trips/${params.tripId}/preferences`)
    } finally {
      setJoining(false)
    }
  }

  async function onShare() {
    const url = `${window.location.origin}/trips/${params.tripId}/join?token=${token}`
    await shareInviteLink("Group Trip", url)
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-lg mx-auto card p-6">
        <h1 className="text-2xl font-semibold">Join this trip</h1>
        <p className="text-sm text-[var(--muted)] mt-2">
          Use the invite link to join and submit your preferences.
        </p>
        <div className="mt-6 space-y-3">
          <button
            className="w-full rounded-full bg-[var(--ink)] text-white px-4 py-2"
            onClick={onJoin}
            disabled={joining || !token}
          >
            {joining ? "Joining..." : "Join trip"}
          </button>
          <button
            className="w-full rounded-full border border-black/10 px-4 py-2"
            onClick={onShare}
            disabled={!token}
          >
            Share invite
          </button>
        </div>
      </div>
    </div>
  )
}
