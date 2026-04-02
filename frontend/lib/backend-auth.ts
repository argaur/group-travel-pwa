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
