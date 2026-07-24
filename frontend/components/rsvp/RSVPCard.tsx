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
  { value: "going", label: "Going", sublabel: "I'm in — count me!", mark: "◆" },
  { value: "maybe", label: "Maybe", sublabel: "Likely, but not sure yet", mark: "◇" },
  { value: "declined", label: "Can't make it", sublabel: "I'll sit this one out", mark: "✕" },
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
    <div className="card relative max-w-md w-full overflow-hidden">
      {/* Top accent strip — the one hot rule */}
      <div className="h-1 w-full" style={{ background: "var(--accent)" }} />

      <div className="px-7 pt-6 pb-7 space-y-6">
        {/* Invitation header */}
        <div className="space-y-2 text-center">
          <p className="m-label">◆ You&apos;re invited to</p>
          <h2
            className="text-[27px] leading-tight"
            style={{ fontFamily: "var(--serif)", fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}
          >
            {tripName}
          </h2>
          {(destination || dateString) && (
            <p className="m-label" style={{ letterSpacing: "0.12em" }}>
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
                  className="flex items-center gap-4 px-4 py-3.5 transition-all duration-150"
                  style={{
                    borderStyle: "solid",
                    borderWidth: isSelected ? 2 : 1.5,
                    borderColor: isSelected ? "var(--accent)" : "var(--ink-15)",
                    background: isSelected ? "var(--paper-edge)" : "var(--paper)",
                    minHeight: 44,
                  }}
                >
                  {/* Squared mark */}
                  <span
                    className="shrink-0 flex items-center justify-center transition-all duration-150"
                    style={{
                      width: 20,
                      height: 20,
                      borderStyle: "solid",
                      borderWidth: isSelected ? 0 : 1.5,
                      borderColor: "var(--ink-15)",
                      background: isSelected ? "var(--accent)" : "transparent",
                      color: isSelected ? "var(--paper)" : "var(--ink-40)",
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {opt.mark}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[15px]"
                      style={{ fontFamily: "var(--body)", color: "var(--ink)", fontWeight: isSelected ? 600 : 400 }}
                    >
                      {isLoading ? "Saving…" : opt.label}
                    </p>
                    <p className="text-[12px] mt-0.5" style={{ fontFamily: "var(--body)", color: "var(--ink-60)" }}>
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
          className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-fade-up"
          style={{
            background: "var(--ink)",
            color: "var(--paper)",
            fontFamily: "var(--mono)",
            fontSize: 10.5,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            padding: "8px 16px",
            boxShadow: "3px 3px 0 var(--accent)",
          }}
        >
          RSVP logged ◆
        </div>
      )}
    </div>
  )
}
