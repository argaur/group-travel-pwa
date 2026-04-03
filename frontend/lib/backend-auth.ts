"use client"

const TOKEN_KEY = "backend_jwt"
const USER_KEY = "backend_user_id"

export function setBackendToken(token: string | null) {
  if (typeof window === "undefined") return
  if (!token) {
    window.sessionStorage.removeItem(TOKEN_KEY)
  } else {
    window.sessionStorage.setItem(TOKEN_KEY, token)
  }
}

export function getBackendToken(): string | null {
  if (typeof window === "undefined") return null
  return window.sessionStorage.getItem(TOKEN_KEY)
}

export function setBackendUserId(id: string | null) {
  if (typeof window === "undefined") return
  if (!id) {
    window.sessionStorage.removeItem(USER_KEY)
  } else {
    window.sessionStorage.setItem(USER_KEY, id)
  }
}

export function getBackendUserId(): string | null {
  if (typeof window === "undefined") return null
  return window.sessionStorage.getItem(USER_KEY)
}

export async function ensureBackendToken(): Promise<string | null> {
  if (typeof window === "undefined") return null

  const existing = getBackendToken()
  if (existing) return existing

  const res = await fetch("/api/backend-token", { method: "POST" })
  const data = await res.json().catch(() => ({}))

  if (!res.ok || !data?.access_token) {
    throw new Error("Could not establish a backend session.")
  }

  setBackendToken(data.access_token)
  if (data?.user_id) setBackendUserId(data.user_id)

  return data.access_token
}
