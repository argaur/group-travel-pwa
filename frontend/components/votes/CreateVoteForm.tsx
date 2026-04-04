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
      // Cast first vote on first option to create the Vote row — backend creates lazily on first cast
      await api.post(`/trips/${tripId}/votes`, {
        vote_type: voteType,
        option_id: options[0],
        value: "up",
      })
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
      <p className="text-xs text-[var(--muted)] px-1 py-2">
        Vote published — others can now cast their votes.
      </p>
    )
  }

  return (
    <div className="border border-dashed border-[var(--line)] rounded-[4px] px-4 py-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p
          className="text-xs uppercase tracking-widest text-[var(--muted)]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Add options (organizer)
        </p>
        <button
          type="button"
          onClick={generateAiOptions}
          disabled={aiLoading}
          className="text-[11px] px-2.5 py-1 rounded-full border border-[var(--accent-lilac)]/50 text-[var(--accent-lilac)] hover:bg-[var(--accent-lilac)]/10 disabled:opacity-40 transition-colors"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {aiLoading ? "Generating…" : "AI suggest"}
        </button>
      </div>
      {aiError && (
        <p className="text-[11px] text-red-500" style={{ fontFamily: "var(--font-body)" }}>
          {aiError}
        </p>
      )}

      {/* Option chips */}
      {options.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <span
              key={opt}
              className="flex items-center gap-1.5 text-xs border border-[var(--line)] rounded-full px-3 py-1"
            >
              {opt}
              <button
                type="button"
                onClick={() => removeOption(opt)}
                className="text-[var(--muted)] hover:text-[var(--ink)] leading-none"
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
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addOption() }
            }}
            placeholder="Add an option…"
            className="flex-1 border border-[var(--line)] rounded-[4px] px-3 py-2 text-sm outline-none focus:border-[var(--accent-lilac)] transition-colors"
            style={{ fontFamily: "var(--font-body)" }}
          />
          <button
            type="button"
            onClick={addOption}
            disabled={!draft.trim()}
            className="px-3 py-2 text-sm border border-[var(--line)] rounded-[4px] hover:border-[var(--accent-lilac)] disabled:opacity-40 transition-colors"
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
        className="w-full h-10 rounded-[4px] bg-[var(--ink)] text-white text-sm font-medium disabled:opacity-40 transition-opacity"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {publishing ? "Publishing…" : `Publish vote · ${options.length} option${options.length !== 1 ? "s" : ""}`}
      </button>
      {options.length < 2 && (
        <p className="text-xs text-[var(--muted)]">Add at least 2 options to publish.</p>
      )}
    </div>
  )
}
