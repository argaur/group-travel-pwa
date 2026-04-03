"use client"

import { SessionProvider, useSession } from "next-auth/react"
import { useEffect } from "react"
import { ensureBackendToken, getBackendToken } from "@/lib/backend-auth"

function BackendTokenBridge() {
  const { status } = useSession()

  useEffect(() => {
    if (status !== "authenticated") return
    if (getBackendToken()) return

    ensureBackendToken().catch(() => {})
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
