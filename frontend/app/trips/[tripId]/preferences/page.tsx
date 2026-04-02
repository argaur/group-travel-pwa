"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { api } from "@/lib/api"

const DIETARY = ["veg", "non-veg", "vegan", "jain", "halal", "no restriction"]
const CONSTRAINTS = ["stroller", "wheelchair", "kitchen access", "early nights"]

export default function PreferencesPage() {
  const params = useParams<{ tripId: string }>()
  const router = useRouter()
  const [budgetMin, setBudgetMin] = useState("5000")
  const [budgetMax, setBudgetMax] = useState("10000")
  const [dietary, setDietary] = useState<string[]>([])
  const [tripStyle, setTripStyle] = useState("relaxed")
  const [constraints, setConstraints] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  function toggle(list: string[], value: string, setter: (v: string[]) => void) {
    if (list.includes(value)) setter(list.filter((v) => v !== value))
    else setter([...list, value])
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/trips/${params.tripId}/preferences`, {
        budget_min: Number(budgetMin),
        budget_max: Number(budgetMax),
        dietary,
        trip_style: tripStyle,
        constraints,
        notes: notes || null,
        is_anonymous: true,
      })
      router.push(`/trips/${params.tripId}/preferences/summary`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-xl mx-auto card p-6">
        <h1 className="text-2xl font-semibold">Preference survey</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Your responses are anonymous to the group.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm mb-1">Budget per day (INR)</label>
            <div className="flex gap-2">
              <input
                className="w-full border border-black/10 rounded-xl px-3 py-2"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                type="number"
                min={0}
              />
              <input
                className="w-full border border-black/10 rounded-xl px-3 py-2"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                type="number"
                min={0}
              />
            </div>
          </div>
          <div>
            <p className="block text-sm mb-1">Dietary</p>
            <div className="flex flex-wrap gap-2">
              {DIETARY.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => toggle(dietary, d, setDietary)}
                  className={`px-3 py-1 rounded-full border ${
                    dietary.includes(d) ? "bg-black text-white" : "border-black/20"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Trip style</label>
            <select
              className="w-full border border-black/10 rounded-xl px-3 py-2"
              value={tripStyle}
              onChange={(e) => setTripStyle(e.target.value)}
            >
              <option value="adventure">Adventure</option>
              <option value="relaxed">Relaxed</option>
              <option value="cultural">Cultural</option>
              <option value="party">Party</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <p className="block text-sm mb-1">Constraints</p>
            <div className="flex flex-wrap gap-2">
              {CONSTRAINTS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => toggle(constraints, c, setConstraints)}
                  className={`px-3 py-1 rounded-full border ${
                    constraints.includes(c)
                      ? "bg-black text-white"
                      : "border-black/20"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Notes (optional)</label>
            <textarea
              className="w-full border border-black/10 rounded-xl px-3 py-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <button
            className="w-full rounded-full bg-[var(--ink)] text-white px-4 py-2"
            disabled={saving}
          >
            {saving ? "Saving..." : "Submit preferences"}
          </button>
        </form>
      </div>
    </div>
  )
}
