"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { api } from "@/lib/api"

export default function NewTripPage() {
  const router = useRouter()
  const { status } = useSession()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/trips/new")
    }
  }, [status, router])
  const [name, setName] = useState("")
  const [destination, setDestination] = useState("")
  const [tripType, setTripType] = useState("leisure")
  const [groupSize, setGroupSize] = useState("")

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const trip = await api.post<{ id: string }>("/trips", {
        name,
        destination: destination || null,
        trip_type: tripType,
        group_size_estimate: groupSize ? Number(groupSize) : null,
      })
      const invite = await api.post<{ invite_token: string }>(
        `/trips/${trip.id}/invite`,
        {}
      )
      router.push(`/trips/${trip.id}/join?token=${invite.invite_token}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-lg mx-auto card p-6">
        <h1 className="text-2xl font-semibold">Create a trip</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Set the basics, then invite your group.
        </p>
        <form onSubmit={onCreate} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm mb-1">Trip name</label>
            <input
              className="w-full border border-black/10 rounded-xl px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Destination (optional)</label>
            <input
              className="w-full border border-black/10 rounded-xl px-3 py-2"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Trip type</label>
            <select
              className="w-full border border-black/10 rounded-xl px-3 py-2"
              value={tripType}
              onChange={(e) => setTripType(e.target.value)}
            >
              <option value="leisure">Leisure</option>
              <option value="family">Family</option>
              <option value="adventure">Adventure</option>
              <option value="office">Office</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Group size estimate</label>
            <input
              className="w-full border border-black/10 rounded-xl px-3 py-2"
              value={groupSize}
              onChange={(e) => setGroupSize(e.target.value)}
              type="number"
              min={1}
            />
          </div>
          <button
            className="w-full rounded-full bg-[var(--ink)] text-white px-4 py-2"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create trip"}
          </button>
        </form>
      </div>
    </div>
  )
}
