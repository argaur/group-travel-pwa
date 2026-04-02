"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import AppShell from "@/components/AppShell"

type Summary = {
  total_members: number
  responded: number
  budget_overlap: { min: number; max: number } | null
  dietary_union: string[]
  style_distribution: Record<string, number>
  gap_flags: string[]
  ai_summary: string | null
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

  return (
    <AppShell
      tripId={params.tripId}
      active="preferences"
      title="Preference summary"
      subtitle="Anonymous group alignment"
    >
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-5 space-y-3 text-sm">
          <div>
            <p className="text-[var(--muted)]">Budget overlap</p>
            <p className="text-lg font-semibold">
              {summary.budget_overlap
                ? `₹${summary.budget_overlap.min} – ₹${summary.budget_overlap.max} / day`
                : "No overlap yet"}
            </p>
          </div>
          <div>
            <p className="text-[var(--muted)]">Dietary constraints</p>
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
