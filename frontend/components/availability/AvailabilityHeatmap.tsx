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

/* Conflict intensity as ink density, ramping to the one hot accent at the top.
   Returns rgba() strings so the border derivation below stays valid. */
function getHeatColor(blocked: number, total: number): string {
  if (total === 0 || blocked === 0) return "rgba(29,37,49,0.05)"
  const pct = blocked / total
  if (pct <= 0.3) return "rgba(29,37,49,0.12)"
  if (pct <= 0.6) return "rgba(29,37,49,0.28)"
  return "rgba(207,59,22,0.45)"
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

export default function AvailabilityHeatmap({ heatmap, totalMembers }: AvailabilityHeatmapProps) {
  if (heatmap.length === 0) {
    return (
      <p className="m-label py-4">Nothing charted yet — invite the party to mark availability</p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 m-label">
        <span>Conflict intensity:</span>
        {[
          { label: "Low (1–30%)", color: "rgba(29,37,49,0.12)", border: "rgba(29,37,49,0.4)" },
          { label: "Mid (31–60%)", color: "rgba(29,37,49,0.28)", border: "rgba(29,37,49,0.55)" },
          { label: "High (61%+)", color: "rgba(207,59,22,0.45)", border: "rgba(207,59,22,0.7)" },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 border"
              style={{ background: l.color, borderColor: l.border }}
            />
            {l.label}
          </span>
        ))}
      </div>

      {/* Date chips — squared grid cells */}
      <div className="flex flex-wrap gap-2">
        {heatmap.map((entry) => {
          const bg = getHeatColor(entry.blocked_count, totalMembers)
          const tooltip = entry.blocked_by.join(", ")
          const isHigh = totalMembers > 0 && entry.blocked_count / totalMembers > 0.6
          return (
            <div
              key={entry.date}
              title={`Blocked by: ${tooltip}`}
              className="border px-3 py-2 cursor-default"
              style={{
                background: bg,
                borderColor: bg.replace(/[\d.]+\)$/, "0.6)"),
              }}
            >
              <p style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: "var(--ink)", letterSpacing: "0.04em" }}>
                {formatDate(entry.date)}
              </p>
              <p
                className="mt-0.5 tabular-nums"
                style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.06em", color: isHigh ? "var(--accent)" : "var(--ink-60)" }}
              >
                {entry.blocked_count}/{totalMembers} blocked
              </p>
            </div>
          )
        })}
      </div>

      <p className="m-label">Hover a date to see who blocked it. Dates not shown have zero conflicts.</p>
    </div>
  )
}
