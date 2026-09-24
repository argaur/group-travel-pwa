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

/* Severity → left-rule weight/ink. One hot accent: only "high" runs vermillion. */
const SEVERITY_STYLES: Record<string, string> = {
  high: "border-l-[3px] border-l-[var(--accent)]",
  medium: "border-l-[3px] border-l-[var(--ink)]",
  low: "border-l-[3px] border-l-[var(--ink-15)]",
}

/* ── The Surfacer as terrain — contours fanning apart by divergence.
   Same idiom + divergence formula as the dashboard's SurfacerTerrain.
   (Deferred: extract to a shared component once the reference file can be
   edited — see DESIGN_CARTOGRAPHY.md rollout note 8.) ── */
function TerrainMini({
  budgetOverlap,
  gapFlags,
  respondedLabel,
}: {
  budgetOverlap: { min: number; max: number } | null
  gapFlags: string[]
  respondedLabel: string
}) {
  const divergence = budgetOverlap === null ? 1 : Math.min(1, gapFlags.length * 0.33)
  const X0 = 36
  const X1 = 596
  const CY = 118
  const contours = [-2, -1, 0, 1, 2].map((i) => {
    const yL = CY + i * 6
    const yR = CY + i * (10 + divergence * 34)
    return { i, d: `M ${X0} ${yL} C 230 ${yL}, 400 ${yR}, ${X1} ${yR}` }
  })

  return (
    <svg
      viewBox="0 0 640 236"
      role="img"
      aria-label={
        budgetOverlap
          ? `Terrain chart: preferences diverge by ${gapFlags.length} flagged gap${gapFlags.length === 1 ? "" : "s"}; a navigable budget pass exists at ₹${budgetOverlap.min} to ₹${budgetOverlap.max} per day`
          : "Terrain chart: the group's budget ranges do not overlap yet — the contour lines fan fully apart"
      }
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {contours.map(({ i, d }) =>
        i === 0 ? (
          <path key={i} className="route-path" d={d} fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" />
        ) : (
          <path key={i} d={d} fill="none" stroke="var(--ink)" strokeWidth="1.3" opacity={Math.abs(i) === 1 ? 0.4 : 0.65} />
        )
      )}

      {divergence > 0.2 && (
        <g stroke="var(--accent)" strokeWidth="1" opacity=".3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line key={i} x1={430 + i * 26} y1={CY - 46 - divergence * 20} x2={410 + i * 26} y2={CY + 46 + divergence * 20} />
          ))}
        </g>
      )}

      <g>
        <circle className="you-dot" cx={X0} cy={CY} r="6" fill="var(--accent)" />
        <circle cx={X0} cy={CY} r="11" fill="none" stroke="var(--accent)" strokeWidth="1" opacity=".5" />
        <text x={X0 - 12} y={CY + 44} fontFamily="var(--mono)" fontSize="10" letterSpacing="2" fill="var(--ink)" fontWeight="700">
          THE PARTY
        </text>
        <text x={X0 - 12} y={CY + 58} fontFamily="var(--mono)" fontSize="8.5" letterSpacing="1.5" fill="var(--ink-60)">
          {respondedLabel}
        </text>
      </g>

      <g>
        <g stroke="var(--accent)" strokeWidth="3" strokeLinecap="round">
          <line x1={X1 + 8} y1={CY - 8} x2={X1 + 24} y2={CY + 8} />
          <line x1={X1 + 24} y1={CY - 8} x2={X1 + 8} y2={CY + 8} />
        </g>
        <text x={X1 + 24} y={CY - 18} fontFamily="var(--mono)" fontSize="10" letterSpacing="2" fill="var(--ink)" fontWeight="700" textAnchor="end">
          THE TRIP
        </text>
      </g>

      <text x="316" y="216" fontFamily="var(--mono)" fontSize="10.5" letterSpacing="2.5" fill="var(--accent)" fontWeight="700" textAnchor="middle">
        {budgetOverlap
          ? `NAVIGABLE PASS — ₹${budgetOverlap.min}–₹${budgetOverlap.max} / DAY`
          : "NO COMMON BUDGET YET — TERRAIN OPEN"}
      </text>
    </svg>
  )
}

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline gap-3">
        <span className="text-[14px]" style={{ fontFamily: "var(--body)", color: "var(--ink)" }}>{label}</span>
        <span className="m-label shrink-0">{count}</span>
      </div>
      <div className="h-2 overflow-hidden" style={{ background: "var(--ink-08)" }}>
        <div className="h-full transition-all" style={{ width: `${pct}%`, background: "var(--accent)" }} />
      </div>
    </div>
  )
}

function distributionBars(title: string, dist: Record<string, number> | undefined) {
  if (!dist || Object.keys(dist).length === 0) return null
  const max = Math.max(...Object.values(dist))
  return (
    <div className="space-y-3">
      <p className="m-label">{title}</p>
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
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--paper)" }}>
        <div className="w-full max-w-md">
          <p className="m-label mb-3">Plotting the route…</p>
          <div className="skeleton-hatch h-4 w-full mb-2" />
          <div className="skeleton-hatch h-4 w-4/5 mb-2" />
          <div className="skeleton-hatch h-4 w-2/3" />
        </div>
      </div>
    )
  }

  const showDemo = summary.show_demo_hint && summary.responded < 2

  return (
    <AppShell
      tripId={params.tripId}
      active="preferences"
      title="Preference summary"
      subtitle="Anonymous group alignment · no individual identities"
    >
      {/* ── FIG. 1 — the Surfacer as terrain ── */}
      <div className="card p-5 md:p-6 animate-fade-up mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
          <span className="fig-tag">
            <b>FIG. 1</b> THE TERRAIN BETWEEN YOU
          </span>
          <span className="m-label">Surfacer · Claude</span>
        </div>
        <TerrainMini
          budgetOverlap={summary.budget_overlap}
          gapFlags={summary.gap_flags}
          respondedLabel={`${summary.responded}/${summary.total_members} BEARINGS IN`}
        />
        {summary.gap_flags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTop: "1px dashed var(--ink-15)" }}>
            {summary.gap_flags.map((flag) => (
              <span key={flag} className="chip hot">⚑ {flag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-5 md:p-6 space-y-6">
          <div>
            <p className="m-label mb-1">Responses</p>
            <p className="text-2xl" style={{ fontFamily: "var(--serif)", fontWeight: 600 }}>
              {summary.responded}
              <span style={{ color: "var(--ink-40)" }}> / {summary.total_members}</span>
              <span className="text-base" style={{ color: "var(--ink-60)" }}> aboard</span>
            </p>
          </div>
          <div style={{ borderTop: "1px dashed var(--ink-15)", paddingTop: 20 }}>
            <p className="m-label mb-1">Budget overlap (group)</p>
            <p className="text-xl" style={{ fontFamily: "var(--serif)", fontWeight: 600 }}>
              {summary.budget_overlap
                ? `₹${summary.budget_overlap.min} – ₹${summary.budget_overlap.max} / day`
                : "No common budget yet"}
            </p>
          </div>
          <div style={{ borderTop: "1px dashed var(--ink-15)", paddingTop: 20 }}>
            <p className="m-label mb-1">Dietary tags (union)</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {summary.dietary_union.length > 0
                ? summary.dietary_union.map((d) => <span key={d} className="chip">{d}</span>)
                : <span className="text-sm" style={{ color: "var(--ink-60)", fontFamily: "var(--body)" }}>None provided</span>}
            </div>
          </div>
          <div style={{ borderTop: "1px dashed var(--ink-15)", paddingTop: 20 }}>
            <p className="m-label mb-1">Trip styles</p>
            <p className="text-sm mt-1" style={{ fontFamily: "var(--body)", color: "var(--ink)" }}>
              {Object.entries(summary.style_distribution)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" · ") || "No data yet"}
            </p>
          </div>

          {distributionBars("Budget bands (anonymous counts)", summary.budget_band_distribution) && (
            <div style={{ borderTop: "1px dashed var(--ink-15)", paddingTop: 20 }}>
              {distributionBars("Budget bands (anonymous counts)", summary.budget_band_distribution)}
            </div>
          )}

          {distributionBars("Dietary mentions (counts)", summary.dietary_distribution) && (
            <div style={{ borderTop: "1px dashed var(--ink-15)", paddingTop: 20 }}>
              {distributionBars("Dietary mentions (counts)", summary.dietary_distribution)}
            </div>
          )}

          {distributionBars("Constraints (counts)", summary.constraint_distribution) && (
            <div style={{ borderTop: "1px dashed var(--ink-15)", paddingTop: 20 }}>
              {distributionBars("Constraints (counts)", summary.constraint_distribution)}
            </div>
          )}

          {showDemo && (
            <div className="p-4 space-y-4" style={{ border: "1px dashed var(--ink-15)", background: "var(--ink-08)" }}>
              <p className="m-label">Illustrative demo (low response)</p>
              {distributionBars("Demo — budget bands", DEMO_BUCKETS.budget_band_distribution)}
              {distributionBars("Demo — dietary", DEMO_BUCKETS.dietary_distribution)}
              {distributionBars("Demo — constraints", DEMO_BUCKETS.constraint_distribution)}
            </div>
          )}
        </div>

        <div className="card p-5 md:p-6 space-y-4">
          <div className="space-y-2">
            <span className="fig-tag"><b>FIG. 2</b> SILENT CONFLICT SURFACER</span>
            <p className="text-sm" style={{ fontFamily: "var(--body)", color: "var(--ink-60)" }}>
              AI reads the anonymous aggregate and names the tensions nobody has
              said out loud yet — grounded in the deterministic gap flags, never
              an individual.
            </p>
          </div>

          {!consensus && (
            <button className="cta sm" onClick={loadConsensus} disabled={consensusLoading}>
              {consensusLoading ? "Surfacing…" : "Surface group consensus"}
              {!consensusLoading && <span className="arrow" aria-hidden="true">→</span>}
            </button>
          )}

          {consensusError && (
            <div className="alert-plate space-y-2" role="alert">
              <p className="m-label" style={{ color: "var(--accent)", fontWeight: 700 }}>⚑ Signal lost</p>
              <p className="text-sm" style={{ fontFamily: "var(--body)" }}>{consensusError}</p>
              <button type="button" onClick={loadConsensus} className="cta-ghost">Retry</button>
            </div>
          )}

          {consensus?.status === "insufficient_responses" && (
            <div className="p-4 text-sm" style={{ border: "1px dashed var(--ink-15)", fontFamily: "var(--body)", color: "var(--ink-60)" }}>
              {consensus.message}
            </div>
          )}

          {consensus?.status === "ok" && consensus.report && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                {consensus.source === "ai" && <span className="chip hot">AI-generated</span>}
                {consensus.source === "deterministic_fallback" && <span className="chip">Deterministic fallback</span>}
                {consensus.cached && <span className="chip">Cached</span>}
              </div>

              {consensus.message && (
                <p className="m-label">{consensus.message}</p>
              )}

              <p className="text-lg" style={{ fontFamily: "var(--serif)", fontWeight: 600 }}>{consensus.report.headline}</p>

              {consensus.report.agreement.length > 0 && (
                <div className="space-y-2">
                  <p className="m-label">The group agrees on</p>
                  <ul className="space-y-2">
                    {consensus.report.agreement.map((a, i) => (
                      <li key={i} className="flex gap-3 text-sm" style={{ fontFamily: "var(--body)" }}>
                        <span style={{ color: "var(--accent)" }}>◆</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-3">
                <p className="m-label">Silent conflicts</p>
                {consensus.report.silent_conflicts.length === 0 && (
                  <p className="text-sm" style={{ fontFamily: "var(--body)", color: "var(--ink-60)" }}>
                    No unvoiced conflicts the numbers support — the group is aligned.
                  </p>
                )}
                {consensus.report.silent_conflicts.map((c, i) => (
                  <div
                    key={i}
                    className={`p-3 space-y-1 ${SEVERITY_STYLES[c.severity] ?? SEVERITY_STYLES.low}`}
                    style={{ background: "var(--paper)" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm" style={{ fontFamily: "var(--body)", fontWeight: 600 }}>{c.topic}</span>
                      <span className="m-label shrink-0">{c.severity}</span>
                    </div>
                    <p className="text-sm" style={{ fontFamily: "var(--body)" }}>{c.description}</p>
                    <p className="m-label" style={{ letterSpacing: "0.12em" }}>Who should talk: {c.who_should_talk}</p>
                  </div>
                ))}
              </div>

              {consensus.report.directions.length > 0 && (
                <div className="space-y-3">
                  <p className="m-label">Directions worth putting to a vote</p>
                  {consensus.report.directions.map((d, i) => (
                    <div key={i} className="p-3 space-y-1" style={{ border: "1px solid var(--ink-15)", background: "var(--paper)" }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm" style={{ fontFamily: "var(--body)", fontWeight: 600 }}>{d.title}</span>
                        <span className="m-label shrink-0">{d.confidence} confidence</span>
                      </div>
                      <p className="text-sm" style={{ fontFamily: "var(--body)" }}>{d.tradeoffs}</p>
                      <p className="m-label" style={{ letterSpacing: "0.12em" }}>Best for: {d.serves_subgroup}</p>
                    </div>
                  ))}
                </div>
              )}

              <button type="button" onClick={loadConsensus} disabled={consensusLoading} className="cta-ghost">
                {consensusLoading ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          )}

          <button className="cta-ghost w-full" onClick={() => router.push(`/dashboard/${params.tripId}`)}>
            ← Back to dashboard
          </button>
        </div>
      </div>
    </AppShell>
  )
}
