"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { api } from "@/lib/api"
import WizardShell from "@/components/wizard/WizardShell"
import OptionTile from "@/components/wizard/OptionTile"

const STEPS = ["Budget", "Food & diet", "Travel style", "Special needs"]

const DIETARY_OPTIONS = [
  { value: "no restriction", label: "No restriction", icon: "🍽️" },
  { value: "veg", label: "Vegetarian", icon: "🥗" },
  { value: "non-veg", label: "Non-veg", icon: "🍗" },
  { value: "vegan", label: "Vegan", icon: "🌱" },
  { value: "jain", label: "Jain", icon: "🙏" },
  { value: "halal", label: "Halal", icon: "☪️" },
]

const STYLE_OPTIONS = [
  {
    value: "relaxed",
    label: "Relaxed",
    icon: "😌",
    description: "Slow mornings, no rush, lots of downtime",
  },
  {
    value: "adventure",
    label: "Adventure",
    icon: "🏕️",
    description: "Active days, physical experiences",
  },
  {
    value: "cultural",
    label: "Cultural",
    icon: "🏛️",
    description: "Museums, local food, hidden gems",
  },
  {
    value: "party",
    label: "Party",
    icon: "🎉",
    description: "Late nights, music, social energy",
  },
  {
    value: "mixed",
    label: "Mixed",
    icon: "🎭",
    description: "A bit of everything — let the group decide",
  },
]

const CONSTRAINT_OPTIONS = [
  { value: "stroller", label: "Stroller-friendly needed", icon: "🍼" },
  { value: "wheelchair", label: "Wheelchair accessible", icon: "♿" },
  { value: "kitchen access", label: "Kitchen access required", icon: "🍳" },
  { value: "early nights", label: "Early nights only", icon: "🌙" },
]

const BUDGET_PRESETS = [
  { label: "Budget", range: [1500, 3000], description: "₹1.5k–3k/day" },
  { label: "Mid-range", range: [3000, 7000], description: "₹3k–7k/day" },
  { label: "Comfort", range: [7000, 15000], description: "₹7k–15k/day" },
  { label: "Luxury", range: [15000, 50000], description: "₹15k+/day" },
]

export default function PreferencesPage() {
  const params = useParams<{ tripId: string }>()
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Step 0 — budget
  const [budgetPreset, setBudgetPreset] = useState<number | null>(null)
  const [budgetMin, setBudgetMin] = useState("3000")
  const [budgetMax, setBudgetMax] = useState("7000")

  // Step 1 — dietary
  const [dietary, setDietary] = useState<string[]>([])

  // Step 2 — trip style
  const [tripStyle, setTripStyle] = useState("relaxed")

  // Step 3 — constraints + notes
  const [constraints, setConstraints] = useState<string[]>([])
  const [notes, setNotes] = useState("")

  function toggleDietary(value: string) {
    if (value === "no restriction") {
      setDietary(["no restriction"])
      return
    }
    const filtered = dietary.filter((d) => d !== "no restriction")
    if (filtered.includes(value)) setDietary(filtered.filter((d) => d !== value))
    else setDietary([...filtered, value])
  }

  function toggleConstraint(value: string) {
    if (constraints.includes(value)) setConstraints(constraints.filter((c) => c !== value))
    else setConstraints([...constraints, value])
  }

  function selectBudgetPreset(index: number) {
    const p = BUDGET_PRESETS[index]
    setBudgetPreset(index)
    setBudgetMin(String(p.range[0]))
    setBudgetMax(String(p.range[1]))
  }

  function handleCustomBudget(field: "min" | "max", val: string) {
    setBudgetPreset(null)
    if (field === "min") setBudgetMin(val)
    else setBudgetMax(val)
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      await api.post(`/trips/${params.tripId}/preferences`, {
        budget_min: Number(budgetMin),
        budget_max: Number(budgetMax),
        dietary: dietary.length > 0 ? dietary : ["no restriction"],
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

  const stepTitles = [
    "What's your daily budget?",
    "Any food preferences?",
    "How do you like to travel?",
    "Anything else we should know?",
  ]
  const stepSubtitles = [
    "Pick a range that feels right — your response stays anonymous.",
    "Select all that apply. This helps with restaurant and activity picks.",
    "Your vibe sets the tone. Only you see this.",
    "Accessibility needs, constraints, or anything else.",
  ]

  function nextDisabled() {
    return false // all steps optional except we just need budget values
  }

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
      submitDisabled={saving}
      loading={saving}
      submitLabel="Submit preferences"
    >
      {/* ── Step 0: Budget ───────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {BUDGET_PRESETS.map((p, i) => (
              <OptionTile
                key={p.label}
                label={p.label}
                description={p.description}
                selected={budgetPreset === i}
                onClick={() => selectBudgetPreset(i)}
                accentColor="var(--accent)"
              />
            ))}
          </div>

          <div>
            <p className="field-label mb-2">Or set a custom range (₹/day)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label block mb-1">Min</label>
                <input
                  type="number"
                  className="field-input"
                  value={budgetMin}
                  onChange={(e) => handleCustomBudget("min", e.target.value)}
                  min={0}
                />
              </div>
              <div>
                <label className="field-label block mb-1">Max</label>
                <input
                  type="number"
                  className="field-input"
                  value={budgetMax}
                  onChange={(e) => handleCustomBudget("max", e.target.value)}
                  min={0}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Dietary ─────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-2">
          {DIETARY_OPTIONS.map((d) => (
            <OptionTile
              key={d.value}
              label={d.label}
              icon={d.icon}
              selected={dietary.includes(d.value)}
              onClick={() => toggleDietary(d.value)}
              accentColor="var(--accent-deep)"
            />
          ))}
        </div>
      )}

      {/* ── Step 2: Trip style ──────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-2">
          {STYLE_OPTIONS.map((s) => (
            <OptionTile
              key={s.value}
              label={s.label}
              description={s.description}
              icon={s.icon}
              selected={tripStyle === s.value}
              onClick={() => setTripStyle(s.value)}
              accentColor="var(--accent-deep)"
            />
          ))}
        </div>
      )}

      {/* ── Step 3: Constraints & notes ─────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="space-y-2">
            {CONSTRAINT_OPTIONS.map((c) => (
              <OptionTile
                key={c.value}
                label={c.label}
                icon={c.icon}
                selected={constraints.includes(c.value)}
                onClick={() => toggleConstraint(c.value)}
                accentColor="var(--accent)"
              />
            ))}
          </div>

          <div>
            <label className="field-label block mb-2">Anything else? (optional)</label>
            <textarea
              className="field-input resize-none"
              style={{ minHeight: "auto" }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Allergies, mobility needs, strong dislikes…"
            />
          </div>
        </div>
      )}
    </WizardShell>
  )
}
