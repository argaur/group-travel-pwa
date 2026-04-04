"use client"

import { useState } from "react"
import { api } from "@/lib/api"

type RSVPCardProps = {
  tripId: string
  tripName: string
  destination?: string | null
  startDate?: string | null
  endDate?: string | null
  currentStatus: string
  onStatusChange: (status: string) => void
}

const OPTIONS = [
  { value: "going", label: "Going", sublabel: "I'm in — count me!", accent: "var(--accent-pink)" },
  { value: "maybe", label: "Maybe", sublabel: "Likely, but not sure yet", accent: "var(--accent-coral)" },
  { value: "declined", label: "Can't make it", sublabel: "I'll sit this one out", accent: "var(--muted)" },
]

export default function RSVPCard({
  tripId,
  tripName,
  destination,
  startDate,
  endDate,
  currentStatus,
  onStatusChange,
}: RSVPCardProps) {
  const [optimistic, setOptimistic] = useState(currentStatus)
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState(false)

  async function choose(status: string) {
    if (saving || optimistic === status) return
    setSaving(status)
    setOptimistic(status)
    try {
      await api.put(`/trips/${tripId}/rsvp`, { status })
      onStatusChange(status)
      setToast(true)
      setTimeout(() => setToast(false), 2500)
    } catch {
      setOptimistic(currentStatus)
    } finally {
      setSaving(null)
    }
  }

  const dateString =
    startDate && endDate
      ? `${new Date(startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${new Date(endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
      : startDate
        ? `From ${new Date(startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
        : null

  return (
    <div className="relative bg-white border border-[var(--line)] rounded-[4px] max-w-md w-full overflow-hidden">
      {/* Top accent strip */}
      <div
        className="h-1 w-full"
        style={{ background: "linear-gradient(90deg, var(--accent-coral), var(--accent-pink))" }}
      />

      <div className="px-7 pt-6 pb-7 space-y-6">
        {/* Invitation header */}
        <div className="space-y-1 text-center">
          <p
            className="text-[13px] text-[var(--muted)]"
            style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300 }}
          >
            You're invited to
          </p>
          <h2
            className="text-[26px] leading-tight text-[var(--ink)]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
          >
            {tripName}
          </h2>
          {(destination || dateString) && (
            <p
              className="text-[13px] text-[var(--muted)] mt-1"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {[destination, dateString].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {OPTIONS.map((opt) => {
            const isSelected = optimistic === opt.value
            const isLoading = saving === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => choose(opt.value)}
                disabled={!!saving}
                className="w-full text-left transition-all duration-150"
              >
                <div
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-[4px] border transition-all duration-150 ${
                    isSelected
                      ? "border-2"
                      : "border border-[var(--line)] hover:border-black/20"
                  }`}
                  style={isSelected ? { borderColor: opt.accent, background: `${opt.accent}0d` } : {}}
                >
                  {/* Radio circle */}
                  <span
                    className="w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all duration-150"
                    style={
                      isSelected
                        ? { borderColor: opt.accent, background: opt.accent }
                        : { borderColor: "var(--line)" }
                    }
                  >
                    {isSelected && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[14px] ${isSelected ? "font-medium" : ""}`}
                      style={{ fontFamily: "var(--font-body)", color: "var(--ink)" }}
                    >
                      {isLoading ? "Saving…" : opt.label}
                    </p>
                    <p
                      className="text-[12px] text-[var(--muted)] mt-0.5"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {opt.sublabel}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[var(--ink)] text-white text-xs px-4 py-2 rounded-full shadow-lg animate-fade-up"
          style={{ fontFamily: "var(--font-body)" }}
        >
          RSVP saved ✓
        </div>
      )}
    </div>
  )
}
