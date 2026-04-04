"use client"

type HeatmapEntry = {
  date: string
  blocked_count: number
  blocked_by: string[]
}

type AvailabilityHeatmapProps = {
  heatmap: HeatmapEntry[]
  totalMembers: number
}

function getHeatColor(blocked: number, total: number): string {
  if (total === 0 || blocked === 0) return "rgba(15,18,34,0.04)"
  const pct = blocked / total
  if (pct <= 0.3) return "rgba(154,140,255,0.20)"
  if (pct <= 0.6) return "rgba(255,138,107,0.30)"
  return "rgba(255,107,154,0.50)"
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

export default function AvailabilityHeatmap({ heatmap, totalMembers }: AvailabilityHeatmapProps) {
  if (heatmap.length === 0) {
    return (
      <p
        className="text-sm text-[var(--muted)] py-4"
        style={{ fontFamily: "var(--font-body)" }}
      >
        No date conflicts yet — invite your group to mark their availability.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--muted)]" style={{ fontFamily: "var(--font-body)" }}>
        <span>Conflict intensity:</span>
        {[
          { label: "Low (1–30%)", color: "rgba(154,140,255,0.20)", border: "rgba(154,140,255,0.4)" },
          { label: "Mid (31–60%)", color: "rgba(255,138,107,0.30)", border: "rgba(255,138,107,0.5)" },
          { label: "High (61%+)", color: "rgba(255,107,154,0.50)", border: "rgba(255,107,154,0.6)" },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-[2px] border"
              style={{ background: l.color, borderColor: l.border }}
            />
            {l.label}
          </span>
        ))}
      </div>

      {/* Date chips */}
      <div className="flex flex-wrap gap-2">
        {heatmap.map((entry) => {
          const bg = getHeatColor(entry.blocked_count, totalMembers)
          const tooltip = entry.blocked_by.join(", ")
          return (
            <div
              key={entry.date}
              title={`Blocked by: ${tooltip}`}
              className="border rounded-[4px] px-3 py-2 cursor-default transition-all duration-100 hover:scale-105"
              style={{
                background: bg,
                borderColor: bg.replace(/[\d.]+\)$/, "0.6)"),
                fontFamily: "var(--font-body)",
              }}
            >
              <p className="text-[12px] font-medium text-[var(--ink)]">{formatDate(entry.date)}</p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5 tabular-nums">
                {entry.blocked_count}/{totalMembers} blocked
              </p>
            </div>
          )
        })}
      </div>

      <p
        className="text-[11px] text-[var(--muted)]"
        style={{ fontFamily: "var(--font-body)" }}
      >
        Hover a date to see who blocked it. Dates not shown have zero conflicts.
      </p>
    </div>
  )
}
