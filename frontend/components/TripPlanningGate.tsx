"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { ensureBackendToken, getBackendUserId } from "@/lib/backend-auth"

type MemberRow = {
  user: { id: string; name: string; avatar_url: string | null }
  role: string
  preference_submitted: boolean
}

export default function TripPlanningGate({
  tripId,
  children,
}: {
  tripId: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const [ok, setOk] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await ensureBackendToken()
        const members = await api.get<MemberRow[]>(`/trips/${tripId}/members`)
        const uid = getBackendUserId()
        const me = members.find((m) => m.user.id === uid)
        if (!me?.preference_submitted) {
          router.replace(`/trips/${tripId}/preferences`)
          return
        }
        if (!cancelled) setOk(true)
      } catch {
        if (!cancelled) router.replace(`/trips/${tripId}/preferences`)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [tripId, router])

  if (!ok) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--paper)" }}>
        <div className="w-full max-w-xs">
          <p className="m-label mb-3">Checking planning access…</p>
          <div className="skeleton-hatch h-4 w-full mb-2" />
          <div className="skeleton-hatch h-4 w-2/3" />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
