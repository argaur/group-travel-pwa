"use client"

import { useSearchParams, useRouter, useParams } from "next/navigation"
import { api } from "@/lib/api"
import { shareInviteLink } from "@/lib/pwa"
import { useState } from "react"
import { Contours } from "@/components/Contours"

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
    <div className="min-h-screen px-6 py-10 relative overflow-hidden flex items-center" style={{ background: "var(--paper)" }}>
      <Contours fixed />
      <div className="max-w-lg mx-auto card p-6 md:p-8 relative z-10 w-full">
        <span className="fig-tag" style={{ marginBottom: 20 }}>
          <b>◆</b> Raise the party
        </span>
        <h1
          className="text-[30px] leading-tight mt-3"
          style={{ fontFamily: "var(--serif)", fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}
        >
          Join this <i style={{ color: "var(--accent)" }}>expedition.</i>
        </h1>
        <p className="text-[15px] mt-3" style={{ fontFamily: "var(--body)", color: "var(--ink-60)" }}>
          Use the invite link to board the trip and take your bearings — one private preference survey.
        </p>
        <div className="mt-7 space-y-3">
          <button className="cta w-full" onClick={onJoin} disabled={joining || !token}>
            {joining ? "Boarding…" : "Join trip"}
            {!joining && <span className="arrow" aria-hidden="true">→</span>}
          </button>
          <button className="cta-ghost w-full" onClick={onShare} disabled={!token}>
            Share invite via WhatsApp
          </button>
        </div>
        {!token && (
          <p className="m-label mt-4" style={{ color: "var(--accent)", fontWeight: 700 }}>
            ⚑ No invite token — ask the organizer for the link
          </p>
        )}
      </div>
    </div>
  )
}
