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

type SilentConflict = {
  topic: string
  severity: string
  description: string
  who_should_talk: string
  grounded_in: string[]
}

type TripDirection = {
  title: string
  tradeoffs: string
  serves_subgroup: string
  confidence: string
}

type ConsensusReport = {
  headline: string
  agreement: string[]
  silent_conflicts: SilentConflict[]
  directions: TripDirection[]
}

type ConsensusResponse = {
  responded: number
  total_members: number
  status: "ok" | "insufficient_responses"
  source?: string
  cached?: boolean
  min_required?: number
  message?: string
  report?: ConsensusReport
}

const SEVERITY_STYLES: Record<string, string> = {
  high: "border-l-[var(--accent-coral)] bg-[var(--accent-coral)]/[0.06]",
  medium: "border-l-[var(--accent-pink)] bg-[var(--accent-pink)]/[0.06]",
  low: "border-l-[var(--accent-lilac)] bg-[var(--accent-lilac)]/[0.06]",
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
  const [consensus, setConsensus] = useState<ConsensusResponse | null>(null)
  const [consensusLoading, setConsensusLoading] = useState(false)
  const [consensusError, setConsensusError] = useState<string | null>(null)

  useEffect(() => {
    api.get<Summary>(`/trips/${params.tripId}/preferences/summary`).then(setSummary)
  }, [params.tripId])

  async function loadConsensus() {
    setConsensusLoading(true)
    setConsensusError(null)
    try {
      const data = await api.get<ConsensusResponse>(
        `/trips/${params.tripId}/preferences/consensus`
      )
      setConsensus(data)
    } catch (e) {
      setConsensusError(e instanceof Error ? e.message : "Failed to surface consensus")
    } finally {
      setConsensusLoading(false)
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

        <div className="card p-5 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Silent Conflict Surfacer</h2>
            <p className="text-sm text-[var(--muted)]">
              AI reads the anonymous aggregate and names the tensions nobody has
              said out loud yet — grounded in the deterministic gap flags, never
              an individual.
            </p>
          </div>

          {!consensus && (
            <button
              className="rounded-full bg-[var(--ink)] text-white px-4 py-2 text-sm disabled:opacity-50"
              onClick={loadConsensus}
              disabled={consensusLoading}
            >
              {consensusLoading ? "Surfacing…" : "Surface group consensus"}
            </button>
          )}

          {consensusError && (
            <div className="space-y-2" role="alert">
              <p className="text-sm text-red-600">{consensusError}</p>
              <button
                type="button"
                onClick={loadConsensus}
                className="text-sm underline text-[var(--muted)]"
              >
                Retry
              </button>
            </div>
          )}

          {consensus?.status === "insufficient_responses" && (
            <div className="border border-dashed border-black/15 rounded-2xl p-4 text-sm text-[var(--muted)]">
              {consensus.message}
            </div>
          )}

          {consensus?.status === "ok" && consensus.report && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                {consensus.source === "ai" && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 bg-[var(--accent-lilac)]/20 text-[var(--ink)]">
                    AI-generated
                  </span>
                )}
                {consensus.source === "deterministic_fallback" && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 bg-black/10 text-[var(--muted)]">
                    Deterministic fallback
                  </span>
                )}
                {consensus.cached && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 bg-black/5 text-[var(--muted)]">
                    Cached
                  </span>
                )}
              </div>

              {consensus.message && (
                <p className="text-xs text-[var(--muted)]">{consensus.message}</p>
              )}

              <p className="text-sm font-medium">{consensus.report.headline}</p>

              {consensus.report.agreement.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    The group agrees on
                  </p>
                  <ul className="space-y-1 text-sm list-disc list-inside">
                    {consensus.report.agreement.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Silent conflicts
                </p>
                {consensus.report.silent_conflicts.length === 0 && (
                  <p className="text-sm text-[var(--muted)]">
                    No unvoiced conflicts the numbers support — the group is aligned.
                  </p>
                )}
                {consensus.report.silent_conflicts.map((c, i) => (
                  <div
                    key={i}
                    className={`border-l-2 rounded-r-xl p-3 space-y-1 ${
                      SEVERITY_STYLES[c.severity] ?? SEVERITY_STYLES.low
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{c.topic}</span>
                      <span className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
                        {c.severity}
                      </span>
                    </div>
                    <p className="text-sm">{c.description}</p>
                    <p className="text-xs text-[var(--muted)]">
                      Who should talk: {c.who_should_talk}
                    </p>
                  </div>
                ))}
              </div>

              {consensus.report.directions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Directions worth putting to a vote
                  </p>
                  {consensus.report.directions.map((d, i) => (
                    <div key={i} className="border border-black/5 rounded-2xl p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{d.title}</span>
                        <span className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
                          {d.confidence} confidence
                        </span>
                      </div>
                      <p className="text-sm">{d.tradeoffs}</p>
                      <p className="text-xs text-[var(--muted)]">Best for: {d.serves_subgroup}</p>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={loadConsensus}
                disabled={consensusLoading}
                className="text-sm underline text-[var(--muted)] disabled:opacity-50"
              >
                {consensusLoading ? "Refreshing…" : "Refresh"}
              </button>
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
