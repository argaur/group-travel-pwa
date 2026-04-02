"use client"

import { SessionProvider, useSession } from "next-auth/react"
import { useEffect } from "react"
import { getBackendToken, setBackendToken, setBackendUserId } from "@/lib/backend-auth"

function BackendTokenBridge() {
  const { status } = useSession()

  useEffect(() => {
    if (status !== "authenticated") return
    if (getBackendToken()) return

    fetch("/api/backend-token", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.access_token) setBackendToken(data.access_token)
        if (data?.user_id) setBackendUserId(data.user_id)
      })
      .catch(() => {})
  }, [status])

  return null
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <BackendTokenBridge />
      {children}
    </SessionProvider>
  )
}
