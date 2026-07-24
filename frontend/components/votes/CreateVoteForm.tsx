"use client"

import { useState } from "react"
import { api } from "@/lib/api"

type CreateVoteFormProps = {
  tripId: string
  voteType: string
  onCreated: () => void
  preferenceSummary?: Record<string, unknown>
}

export default function CreateVoteForm({
  tripId,
  voteType,
  onCreated,
  preferenceSummary = {},
}: CreateVoteFormProps) {
  const [options, setOptions] = useState<string[]>([])
  const [draft, setDraft] = useState("")
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  function addOption() {
    const val = draft.trim()
    if (!val || options.includes(val) || options.length >= 5) return
    setOptions((prev) => [...prev, val])
    setDraft("")
  }

  function removeOption(opt: string) {
    setOptions((prev) => prev.filter((o) => o !== opt))
  }

  async function generateAiOptions() {
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await api.post<{ options: Array<{ id: string; label: string }> }>(
        `/trips/${tripId}/vote-options/ai-generate`,
        { vote_type: voteType, context: preferenceSummary }
      )
      const labels = res.options.map((o) => o.label).filter(Boolean).slice(0, 5)
      setOptions(labels)
    } catch {
      setAiError("AI suggestion failed. Add options manually.")
    } finally {
      setAiLoading(false)
    }
  }

  async function publish() {
    if (options.length < 2 || publishing) return
    setPublishing(true)
    try {
      // Persist the ballot options WITHOUT casting a vote (organizer stays unbiased).
      await api.post(`/trips/${tripId}/votes/${voteType}/options`, { options })
      setPublished(true)
      onCreated()
    } catch {
      // silent — onCreated will reload
    } finally {
      setPublishing(false)
    }
  }

  if (published) {
    return (
      <p className="m-label px-1 py-2">Vote published — the party can now cast</p>
    )
  }

  return (
    <div className="px-4 py-3 space-y-3" style={{ border: "1px dashed var(--ink-15)", background: "var(--paper)" }}>
      <div className="flex items-center justify-between gap-2">
        <p className="field-label">Add options (organizer)</p>
        <button
          type="button"
          onClick={generateAiOptions}
          disabled={aiLoading}
          className="cta-ghost"
          style={{ minHeight: 34, padding: "6px 12px", fontSize: 10.5 }}
        >
          {aiLoading ? "Generating…" : "◆ AI suggest"}
        </button>
      </div>
      {aiError && (
        <p className="m-label" style={{ color: "var(--accent)", fontWeight: 700 }}>⚑ {aiError}</p>
      )}

      {/* Option chips */}
      {options.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <span key={opt} className="chip flex items-center gap-1.5">
              {opt}
              <button
                type="button"
                onClick={() => removeOption(opt)}
                className="leading-none"
                style={{ color: "var(--ink-40)" }}
                aria-label={`Remove ${opt}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input row */}
      {options.length < 5 && (
        <div className="flex gap-2 items-end">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addOption() }
            }}
            placeholder="Add an option…"
            className="field-input flex-1"
          />
          <button
            type="button"
            onClick={addOption}
            disabled={!draft.trim()}
            className="cta-ghost"
          >
            Add
          </button>
        </div>
      )}

      {/* Publish */}
      <button
        type="button"
        onClick={publish}
        disabled={options.length < 2 || publishing}
        className="cta sm w-full"
      >
        {publishing ? "Publishing…" : `Publish vote · ${options.length} option${options.length !== 1 ? "s" : ""}`}
      </button>
      {options.length < 2 && (
        <p className="m-label">Add at least 2 options to publish</p>
      )}
    </div>
  )
}
