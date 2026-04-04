"use client"

import { useEffect, useRef, useState } from "react"
import { api } from "@/lib/api"

type VoteCardProps = {
  tripId: string
  voteType: string
  label: string
  options: string[]
  tally: Record<string, number>
  currentVote?: string
  onVoteCast: () => void
}

export default function VoteCard({
  tripId,
  voteType,
  label,
  options,
  tally,
  currentVote,
  onVoteCast,
}: VoteCardProps) {
  const [optimisticVote, setOptimisticVote] = useState(currentVote)
  const [casting, setCasting] = useState<string | null>(null)
  const totalVotes = Object.values(tally).reduce((s, c) => s + c, 0)
  const barRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Animate bars in on mount / tally change
  useEffect(() => {
    Object.entries(barRefs.current).forEach(([option, el]) => {
      if (!el) return
      const count = tally[option] ?? 0
      const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0
      // Start at 0 width, then transition to real width
      el.style.width = "0%"
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.width = `${pct}%`
        })
      })
    })
  }, [tally, totalVotes])

  async function castVote(option: string) {
    if (casting) return
    setCasting(option)
    setOptimisticVote(option)
    try {
      await api.post(`/trips/${tripId}/votes`, {
        vote_type: voteType,
        option_id: option,
        value: "up",
      })
      onVoteCast()
    } catch {
      setOptimisticVote(currentVote)
    } finally {
      setCasting(null)
    }
  }

  const accentColor = "var(--accent-lilac)"

  return (
    <div
      className="bg-white border border-[var(--line)] rounded-[4px] overflow-hidden"
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3">
        <h3
          className="text-[19px] leading-snug"
          style={{ fontFamily: "var(--font-display)", fontWeight: 300 }}
        >
          {label}
        </h3>
        {totalVotes > 0 && (
          <span className="text-xs rounded-full px-2.5 py-1 bg-[var(--accent-lilac)]/10 text-[var(--accent-lilac)] font-medium tabular-nums">
            {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Options */}
      <div className="px-4 pb-4 space-y-2">
        {options.length === 0 ? (
          <p className="text-sm text-[var(--muted)] px-1 py-2">
            No options added yet.
          </p>
        ) : (
          options.map((option) => {
            const count = tally[option] ?? 0
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
            const isSelected = optimisticVote === option
            const isLoading = casting === option

            return (
              <button
                key={option}
                type="button"
                onClick={() => castVote(option)}
                disabled={!!casting}
                className="w-full text-left group relative"
              >
                <div
                  className={`relative border rounded-[4px] px-4 py-3 transition-all duration-150 ${
                    isSelected
                      ? "border-[var(--accent-lilac)] bg-[var(--accent-lilac)]/6"
                      : "border-[var(--line)] hover:border-[var(--accent-lilac)]/50 hover:bg-[var(--accent-lilac)]/3"
                  }`}
                >
                  {/* Progress bar track */}
                  <div className="absolute inset-0 rounded-[4px] overflow-hidden pointer-events-none">
                    <div
                      ref={(el) => { barRefs.current[option] = el }}
                      className="h-full bg-[var(--accent-lilac)]/12 transition-[width] duration-500 ease-out"
                      style={{ width: "0%" }}
                    />
                  </div>

                  {/* Content */}
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Selected checkmark */}
                      <span
                        className={`w-4 h-4 shrink-0 rounded-full border flex items-center justify-center transition-all duration-150 ${
                          isSelected
                            ? "border-[var(--accent-lilac)] bg-[var(--accent-lilac)]"
                            : "border-[var(--line)]"
                        }`}
                      >
                        {isSelected && (
                          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                            <path
                              d="M1 3L3 5L7 1"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span
                        className={`text-sm truncate ${
                          isSelected ? "font-medium text-[var(--ink)]" : "text-[var(--ink)]"
                        }`}
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        {isLoading ? "Casting…" : option}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {totalVotes > 0 && (
                        <span className="text-xs text-[var(--muted)] tabular-nums">
                          {pct}%
                        </span>
                      )}
                      {count > 0 && (
                        <span className="text-xs font-medium text-[var(--muted)] tabular-nums">
                          {count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
