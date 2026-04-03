"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { api } from "@/lib/api"
import { ensureBackendToken } from "@/lib/backend-auth"

type PlaceHit = {
  place_id: string
  name: string
  formatted_address?: string | null
}

export default function NewTripPage() {
  const router = useRouter()
  const { status } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/trips/new")
    }
  }, [status, router])
  const [name, setName] = useState("")
  const [destination, setDestination] = useState("")
  const [placeId, setPlaceId] = useState<string | null>(null)
  const [tripType, setTripType] = useState("leisure")
  const [groupSize, setGroupSize] = useState("")
  const [searchHits, setSearchHits] = useState<PlaceHit[]>([])
  const [searching, setSearching] = useState(false)

  const runPlaceSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSearchHits([])
      return
    }
    setSearching(true)
    try {
      await ensureBackendToken()
      const res = await api.get<{ results: PlaceHit[] }>(
        `/places/search?q=${encodeURIComponent(q.trim())}`,
      )
      setSearchHits(res.results?.slice(0, 6) ?? [])
    } catch {
      setSearchHits([])
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => runPlaceSearch(destination), 350)
    return () => clearTimeout(t)
  }, [destination, runPlaceSearch])

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (status !== "authenticated") {
      router.push("/auth/signin?callbackUrl=/trips/new")
      return
    }

    setLoading(true)
    try {
      await ensureBackendToken()

      const trip = await api.post<{ id: string }>("/trips", {
        name,
        destination: destination || null,
        trip_type: tripType,
        group_size_estimate: groupSize ? Number(groupSize) : null,
      })
      void placeId // reserved for future: persist place on trip
      const invite = await api.post<{ invite_token: string }>(
        `/trips/${trip.id}/invite`,
        {},
      )
      router.push(`/trips/${trip.id}/join?token=${invite.invite_token}`)
    } catch {
      setError("Could not create trip. Please sign in again and retry.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-lg mx-auto card p-6">
        <h1 className="text-2xl font-semibold">Create a trip</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Set the basics, then invite your group. Destination search uses Google Places when
          configured (sample data otherwise).
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
              onChange={(e) => {
                setDestination(e.target.value)
                setPlaceId(null)
              }}
              placeholder="Type to search places…"
            />
            {searching && (
              <p className="text-xs text-[var(--muted)] mt-1">Searching…</p>
            )}
            {searchHits.length > 0 && (
              <ul className="mt-2 border border-black/10 rounded-xl overflow-hidden text-sm max-h-48 overflow-y-auto">
                {searchHits.map((h) => (
                  <li key={h.place_id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-black/[0.04]"
                      onClick={() => {
                        setDestination(h.name)
                        setPlaceId(h.place_id)
                        setSearchHits([])
                      }}
                    >
                      <span className="font-medium">{h.name}</span>
                      {h.formatted_address && (
                        <span className="block text-xs text-[var(--muted)]">
                          {h.formatted_address}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>
      </div>
    </div>
  )
}
