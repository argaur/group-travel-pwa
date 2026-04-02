import { auth } from "@/auth"
import { NextResponse } from "next/server"
import crypto from "crypto"

function canonicalPayload(payload: Record<string, unknown>) {
  const keys = Object.keys(payload).sort()
  const sorted: Record<string, unknown> = {}
  for (const key of keys) sorted[key] = payload[key]
  return JSON.stringify(sorted)
}

export async function POST() {
  const session = await auth()
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const payload = {
    sub: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    avatar_url: session.user.image ?? null,
    iat: Math.floor(Date.now() / 1000),
  }

  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    return NextResponse.json({ error: "missing NEXTAUTH_SECRET" }, { status: 500 })
  }

  const canonical = canonicalPayload(payload)
  const signature = crypto
    .createHmac("sha256", secret)
    .update(canonical)
    .digest("hex")

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/auth/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload, signature }),
    }
  )

  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
