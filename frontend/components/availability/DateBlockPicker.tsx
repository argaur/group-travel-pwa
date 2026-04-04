"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"

type DateBlockPickerProps = {
  tripId: string | null       // null = onChange-only mode (trip creation wizard)
  initialBlocks: string[]     // ISO date strings
  onChange?: (dates: string[]) => void
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export default function DateBlockPicker({ tripId, initialBlocks, onChange }: DateBlockPickerProps) {
  const [blocked, setBlocked] = useState<Set<string>>(new Set(initialBlocks))
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(false)

  const today = new Date()
  // Render 3 months starting from current month
  const months = [0, 1, 2].map((offset) => {
    const d = new Date(today.getFullYear(), today.getMonth() + offset, 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  useEffect(() => {
    setBlocked(new Set(initialBlocks))
  }, [initialBlocks])

  function toggleDate(iso: string) {
    setBlocked((prev) => {
      const next = new Set(prev)
      if (next.has(iso)) {
        next.delete(iso)
      } else {
        next.add(iso)
      }
      onChange?.(Array.from(next))
      return next
    })
  }

  async function save() {
    if (!tripId || saving) return
    setSaving(true)
    try {
      await api.post(`/trips/${tripId}/availability`, {
        blocked_dates: Array.from(blocked),
      })
      setToast(true)
      setTimeout(() => setToast(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <p
        className="text-[12px] italic text-[var(--muted)]"
        style={{ fontFamily: "var(--font-body)" }}
      >
        Only aggregate counts are shown to others — not your specific dates.
      </p>

      {months.map(({ year, month }) => {
        const days = getDaysInMonth(year, month)
        const firstDay = getFirstDayOfWeek(year, month)
        const blanks = Array(firstDay).fill(null)
        const allDays = Array.from({ length: days }, (_, i) => i + 1)

        return (
          <div key={`${year}-${month}`} className="space-y-2">
            <p
              className="text-[12px] uppercase tracking-widest text-[var(--muted)]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {MONTH_NAMES[month]} {year}
            </p>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] text-[var(--muted)] py-1"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {blanks.map((_, i) => (
                <div key={`blank-${i}`} />
              ))}
              {allDays.map((day) => {
                const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                const isBlocked = blocked.has(iso)
                const isPast = new Date(iso) < today && new Date(iso).toDateString() !== today.toDateString()
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => !isPast && toggleDate(iso)}
                    disabled={isPast}
                    className={`relative w-full aspect-square flex items-center justify-center rounded-[3px] text-[12px] transition-all duration-100 ${
                      isPast
                        ? "opacity-30 cursor-not-allowed"
                        : isBlocked
                          ? "cursor-pointer"
                          : "hover:bg-[var(--line)] cursor-pointer"
                    }`}
                    style={
                      isBlocked
                        ? { background: "rgba(255, 138, 107, 0.15)", color: "var(--accent-coral)" }
                        : { fontFamily: "var(--font-body)", color: "var(--ink)" }
                    }
                    title={isBlocked ? "Blocked — click to unblock" : "Click to block"}
                  >
                    {day}
                    {isBlocked && (
                      <span className="absolute top-0.5 right-0.5 text-[8px] text-[var(--accent-coral)] leading-none">
                        ✕
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Blocked count summary */}
      {blocked.size > 0 && (
        <p
          className="text-[12px] text-[var(--muted)]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {blocked.size} date{blocked.size !== 1 ? "s" : ""} marked as no-go
        </p>
      )}

      {/* Save button — only in connected mode */}
      {tripId && (
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="h-10 px-6 rounded-[4px] bg-[var(--ink)] text-white text-sm font-medium disabled:opacity-40 transition-opacity"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {saving ? "Saving…" : "Save my dates"}
        </button>
      )}

      {toast && (
        <p className="text-[12px] text-emerald-600" style={{ fontFamily: "var(--font-body)" }}>
          Dates saved ✓
        </p>
      )}
    </div>
  )
}
