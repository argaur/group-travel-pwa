"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import AppShell from "@/components/AppShell"

const DEMO_BUCKETS = {
  budget_band_distribution: {
    "₹0 – ₹5k / day": 2,
    "₹5k – ₹10k / day": 4,
    "₹10k – ₹20k / day": 1,
  },
  dietary_distribution: {
    veg: 4,
    "non-veg": 2,
    vegan: 1,
  },
  constraint_distribution: {
    "kitchen access": 2,
    stroller: 1,
    "early nights": 3,
  },
}

type Summary = {
  total_members: number
  responded: number
  show_demo_hint?: boolean
  budget_overlap: { min: number; max: number } | null
  dietary_union: string[]
  dietary_distribution?: Record<string, number>
  style_distribution: Record<string, number>
  constraint_distribution?: Record<string, number>
  budget_band_distribution?: Record<string, number>
  gap_flags: string[]
  ai_summary: string | null
}

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="text-[var(--muted)]">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-black/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--accent-coral)] to-[var(--accent-pink)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function distributionBars(title: string, dist: Record<string, number> | undefined) {
  if (!dist || Object.keys(dist).length === 0) return null
  const max = Math.max(...Object.values(dist))
  return (
    <div className="space-y-3">
      <p className="text-[var(--muted)] text-sm">{title}</p>
      <div className="space-y-3">
        {Object.entries(dist).map(([k, v]) => (
          <BarRow key={k} label={k} count={v} max={max} />
        ))}
      </div>
    </div>
  )
}

export default function PreferenceSummaryPage() {
  const params = useParams<{ tripId: string }>()
  const router = useRouter()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get<Summary>(`/trips/${params.tripId}/preferences/summary`).then(setSummary)
  }, [params.tripId])

  async function loadAi() {
    setLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await api.get<any>(
        `/trips/${params.tripId}/preferences/ai-synthesis`
      )
      setAiSummary(data.summary ?? data.raw ?? null)
    } catch {
      setAiSummary("Not enough responses yet to generate AI summary.")
    } finally {
      setLoading(false)
    }
  }

  if (!summary) {
    return <div className="p-6">Loading...</div>
  }

  const showDemo = summary.show_demo_hint && summary.responded < 2

  return (
    <AppShell
      tripId={params.tripId}
      active="preferences"
      title="Preference summary"
      subtitle="Anonymous group alignment (no individual identities)"
    >
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-5 space-y-6 text-sm">
          <div>
            <p className="text-[var(--muted)]">Responses</p>
            <p className="text-lg font-semibold">
              {summary.responded} of {summary.total_members} members
            </p>
          </div>
          <div>
            <p className="text-[var(--muted)]">Budget overlap (group)</p>
            <p className="text-lg font-semibold">
              {summary.budget_overlap
                ? `₹${summary.budget_overlap.min} – ₹${summary.budget_overlap.max} / day`
                : "No overlap yet"}
            </p>
          </div>
          <div>
            <p className="text-[var(--muted)]">Dietary tags (union)</p>
            <p>{summary.dietary_union.join(", ") || "None provided"}</p>
          </div>
          <div>
            <p className="text-[var(--muted)]">Trip styles</p>
            <p>
              {Object.entries(summary.style_distribution)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ") || "No data yet"}
            </p>
          </div>
          {summary.gap_flags.length > 0 && (
            <div>
              <p className="text-[var(--muted)]">Gap flags</p>
              <p>{summary.gap_flags.join(", ")}</p>
            </div>
          )}

          {distributionBars("Budget bands (anonymous counts)", summary.budget_band_distribution)}

          {distributionBars("Dietary mentions (counts)", summary.dietary_distribution)}

          {distributionBars("Constraints (counts)", summary.constraint_distribution)}

          {showDemo && (
            <div className="border border-dashed border-black/15 rounded-2xl p-4 space-y-4 bg-black/[0.02]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Illustrative demo (low response)
              </p>
              {distributionBars("Demo — budget bands", DEMO_BUCKETS.budget_band_distribution)}
              {distributionBars("Demo — dietary", DEMO_BUCKETS.dietary_distribution)}
              {distributionBars("Demo — constraints", DEMO_BUCKETS.constraint_distribution)}
            </div>
          )}
        </div>

        <div className="card p-5 space-y-3">
          <h2 className="text-lg font-semibold">AI synthesis</h2>
          <p className="text-sm text-[var(--muted)]">
            Generate a group summary once enough responses are in.
          </p>
          <button
            className="rounded-full bg-[var(--ink)] text-white px-4 py-2 text-sm"
            onClick={loadAi}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
          {aiSummary && (
            <div className="border border-black/5 rounded-2xl p-4 text-sm">
              {aiSummary}
            </div>
          )}
          <button
            className="rounded-full border border-black/10 px-4 py-2 text-sm"
            onClick={() => router.push(`/dashboard/${params.tripId}`)}
          >
            Back to dashboard
          </button>
        </div>
      </div>
    </AppShell>
  )
}
