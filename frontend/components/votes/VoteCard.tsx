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
      })
      onVoteCast()
    } catch {
      setOptimisticVote(currentVote)
    } finally {
      setCasting(null)
    }
  }

  return (
    <div className="card flat overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3">
        <h3 className="text-[20px] leading-snug" style={{ fontFamily: "var(--serif)", fontWeight: 600 }}>
          {label}
        </h3>
        {totalVotes > 0 && (
          <span className="chip hot tabular-nums">
            {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Options */}
      <div className="px-4 pb-4 space-y-2">
        {options.length === 0 ? (
          <p className="m-label px-1 py-2">Nothing charted yet</p>
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
                  className="relative px-4 py-3 transition-all duration-150"
                  style={{
                    borderStyle: "solid",
                    borderWidth: isSelected ? 2 : 1.5,
                    borderColor: isSelected ? "var(--accent)" : "var(--ink-15)",
                    background: isSelected ? "var(--paper-edge)" : "var(--paper)",
                    minHeight: 44,
                  }}
                >
                  {/* Progress bar track */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div
                      ref={(el) => { barRefs.current[option] = el }}
                      className="h-full transition-[width] duration-500 ease-out"
                      style={{ width: "0%", background: "color-mix(in oklab, var(--accent) 12%, transparent)" }}
                    />
                  </div>

                  {/* Content */}
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Squared select mark */}
                      <span
                        className="shrink-0 flex items-center justify-center transition-all duration-150"
                        style={{
                          width: 16,
                          height: 16,
                          borderStyle: "solid",
                          borderWidth: isSelected ? 0 : 1.5,
                          borderColor: "var(--ink-15)",
                          background: isSelected ? "var(--accent)" : "transparent",
                        }}
                      >
                        {isSelected && (
                          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                            <path d="M1 3L3 5L7 1" stroke="var(--paper)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span
                        className="text-sm truncate"
                        style={{ fontFamily: "var(--body)", color: "var(--ink)", fontWeight: isSelected ? 600 : 400 }}
                      >
                        {isLoading ? "Casting…" : option}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0" style={{ fontFamily: "var(--mono)" }}>
                      {totalVotes > 0 && (
                        <span className="text-[11px] tabular-nums" style={{ color: "var(--ink-60)", letterSpacing: "0.08em" }}>
                          {pct}%
                        </span>
                      )}
                      {count > 0 && (
                        <span className="text-[11px] tabular-nums" style={{ color: "var(--accent)", fontWeight: 700 }}>
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
