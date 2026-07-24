"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { api } from "@/lib/api"
import { ensureBackendToken } from "@/lib/backend-auth"
import WizardShell from "@/components/wizard/WizardShell"
import OptionTile from "@/components/wizard/OptionTile"
import PlaceSearchInput, { type PlaceResult } from "@/components/places/PlaceSearchInput"
import PlaceCard from "@/components/places/PlaceCard"

const STEPS = ["Trip basics", "Destination", "Dates & size"]

const TRIP_TYPES = [
  { value: "leisure", label: "Leisure", icon: "🌴", description: "Relax, explore, unwind" },
  { value: "adventure", label: "Adventure", icon: "🧗", description: "Hike, trek, or thrill-seek" },
  { value: "beach", label: "Beach", icon: "🏖️", description: "Sun, sand, and sea" },
  { value: "mountain", label: "Mountain", icon: "⛰️", description: "High altitudes & cool air" },
  { value: "family", label: "Family", icon: "👨‍👩‍👧", description: "Kid-friendly & inclusive" },
  { value: "office", label: "Office trip", icon: "💼", description: "Team building & retreats" },
]

export default function NewTripPage() {
  const router = useRouter()
  const { status } = useSession()

  // Wizard state
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 0 — basics
  const [name, setName] = useState("")
  const [tripType, setTripType] = useState("leisure")

  // Step 1 — destination
  const [destination, setDestination] = useState("")
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null)

  // Step 2 — dates & size
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [groupSize, setGroupSize] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/trips/new")
    }
  }, [status, router])

  function handlePlaceSelect(place: PlaceResult) {
    setSelectedPlace(place)
    setDestination(place.name)
  }

  function clearPlace() {
    setSelectedPlace(null)
    setDestination("")
  }

  function nextDisabled() {
    if (step === 0) return !name.trim()
    return false
  }

  async function handleSubmit() {
    if (status !== "authenticated") {
      router.push("/auth/signin?callbackUrl=/trips/new")
      return
    }

    setError(null)
    setLoading(true)
    try {
      await ensureBackendToken()

      const trip = await api.post<{ id: string }>("/trips", {
        name,
        destination: destination || null,
        trip_type: tripType,
        group_size_estimate: groupSize ? Number(groupSize) : null,
        start_date: startDate || null,
        end_date: endDate || null,
      })

      if (selectedPlace) {
        await api.put(`/trips/${trip.id}/place`, {
          place_id: selectedPlace.place_id,
          place_name: selectedPlace.name,
          place_photo_url: selectedPlace.primary_photo_url ?? null,
          place_rating: selectedPlace.rating ?? null,
        }).catch(() => {/* non-blocking */})
      }

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

  const stepTitles = [
    "Name your adventure",
    "Where are you headed?",
    "When & how many?",
  ]
  const stepSubtitles = [
    "Pick a name that gets everyone excited.",
    "Search for a place or type a destination freely.",
    "Rough dates and headcount help with planning.",
  ]

  return (
    <WizardShell
      steps={STEPS}
      currentStep={step}
      title={stepTitles[step]}
      subtitle={stepSubtitles[step]}
      onBack={() => setStep((s) => s - 1)}
      onNext={() => setStep((s) => s + 1)}
      onSubmit={handleSubmit}
      nextDisabled={nextDisabled()}
      submitDisabled={loading}
      loading={loading}
      submitLabel="Create trip & get invite link"
    >
      {/* ── Step 0: Basics ───────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-6">
          <div>
            <label className="field-label block mb-2">Trip name *</label>
            <input
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Goa Weekend Escape"
              autoFocus
            />
          </div>

          <div>
            <label className="field-label block mb-3">Trip type</label>
            <div className="grid grid-cols-2 gap-2">
              {TRIP_TYPES.map((t) => (
                <OptionTile
                  key={t.value}
                  label={t.label}
                  description={t.description}
                  icon={t.icon}
                  selected={tripType === t.value}
                  onClick={() => setTripType(t.value)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Destination ──────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          {selectedPlace ? (
            <PlaceCard placeId={selectedPlace.place_id} onDismiss={clearPlace} />
          ) : (
            <>
              <PlaceSearchInput
                value={destination}
                onSelect={handlePlaceSelect}
                onChange={setDestination}
                placeholder="Search Google Places…"
              />
              {destination && (
                <p className="text-[12px]" style={{ fontFamily: "var(--body)", color: "var(--ink-60)" }}>
                  Type to search, or continue with this text as-is.
                </p>
              )}
            </>
          )}

          <p className="text-[13px] pt-2" style={{ fontFamily: "var(--body)", color: "var(--ink-60)" }}>
            Destination is optional — you can chart it later with the group.
          </p>
        </div>
      )}

      {/* ── Step 2: Dates & size ─────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label block mb-2">Start date</label>
              <input
                type="date"
                className="field-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label block mb-2">End date</label>
              <input
                type="date"
                className="field-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="field-label block mb-2">Group size estimate</label>
            <input
              className="field-input"
              value={groupSize}
              onChange={(e) => setGroupSize(e.target.value)}
              type="number"
              min={1}
              placeholder="e.g. 6"
            />
          </div>

          {error && (
            <div className="alert-plate">
              <p className="m-label" style={{ color: "var(--accent)", fontWeight: 700 }}>⚑ {error}</p>
            </div>
          )}
        </div>
      )}
    </WizardShell>
  )
}
