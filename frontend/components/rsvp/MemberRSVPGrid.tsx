"use client"

import { useState } from "react"

type RSVPMember = {
  user_id: string
  name: string
  avatar_url: string | null
  role: string
  preference_submitted: boolean
  rsvp_status: string
  rsvp_updated_at: string | null
}

type MemberRSVPGridProps = {
  members: RSVPMember[]
  currentUserId: string
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; borderColor: string }> = {
  going: { label: "Going", bg: "bg-[var(--accent-pink)]/10", text: "text-[var(--accent-pink)]", borderColor: "var(--accent-pink)" },
  maybe: { label: "Maybe", bg: "bg-[var(--accent-coral)]/10", text: "text-[var(--accent-coral)]", borderColor: "var(--accent-coral)" },
  declined: { label: "Declined", bg: "bg-[var(--muted)]/10", text: "text-[var(--muted)]", borderColor: "var(--line)" },
  pending: { label: "Pending", bg: "bg-[var(--line)]", text: "text-[var(--muted)]", borderColor: "var(--line)" },
}

type FilterTab = "all" | "going" | "pending" | "survey_done"

function Avatar({ name, avatarUrl, size = 40 }: { name: string; avatarUrl: string | null; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
  // Deterministic color from name
  const colors = ["#ff6b9a", "#ff8a6b", "#9a8cff", "#6bc5ff", "#6bffb8"]
  const colorIndex = name.charCodeAt(0) % colors.length
  const bg = colors[colorIndex]

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white shrink-0 text-[11px] font-semibold"
      style={{ width: size, height: size, background: bg, fontFamily: "var(--font-body)" }}
    >
      {initials}
    </div>
  )
}

export default function MemberRSVPGrid({ members, currentUserId }: MemberRSVPGridProps) {
  const [filter, setFilter] = useState<FilterTab>("all")

  const counts = {
    going: members.filter((m) => m.rsvp_status === "going").length,
    maybe: members.filter((m) => m.rsvp_status === "maybe").length,
    pending: members.filter((m) => m.rsvp_status === "pending").length,
    declined: members.filter((m) => m.rsvp_status === "declined").length,
    survey_done: members.filter((m) => m.preference_submitted).length,
  }

  const filtered = members.filter((m) => {
    if (filter === "going") return m.rsvp_status === "going"
    if (filter === "pending") return m.rsvp_status === "pending"
    if (filter === "survey_done") return m.preference_submitted
    return true
  })

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: "All", count: members.length },
    { id: "going", label: "Going", count: counts.going },
    { id: "pending", label: "Pending", count: counts.pending },
    { id: "survey_done", label: "Survey done", count: counts.survey_done },
  ]

  return (
    <div className="space-y-4 w-full max-w-2xl">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: `${counts.going} Going`, color: "var(--accent-pink)" },
          { label: `${counts.maybe} Maybe`, color: "var(--accent-coral)" },
          { label: `${counts.pending} Pending`, color: "var(--muted)" },
          { label: `${counts.declined} Declined`, color: "var(--line)" },
        ].map((chip) => (
          <span
            key={chip.label}
            className="text-[11px] px-3 py-1 rounded-full border"
            style={{
              fontFamily: "var(--font-body)",
              borderColor: chip.color,
              color: chip.color === "var(--line)" ? "var(--muted)" : chip.color,
            }}
          >
            {chip.label}
          </span>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-[var(--line)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-2 text-[12px] border-b-2 -mb-px transition-colors duration-100 ${
              filter === tab.id
                ? "border-[var(--accent-lilac)] text-[var(--ink)] font-medium"
                : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
            style={{ fontFamily: "var(--font-body)" }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 tabular-nums opacity-60">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Member list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-[var(--muted)] py-4" style={{ fontFamily: "var(--font-body)" }}>
            No members in this category.
          </p>
        )}
        {filtered.map((m) => {
          const statusCfg = STATUS_CONFIG[m.rsvp_status] ?? STATUS_CONFIG.pending
          const isMe = m.user_id === currentUserId
          return (
            <div
              key={m.user_id}
              className="stagger-child bg-white border border-[var(--line)] rounded-[4px] px-4 py-3 flex items-center gap-3"
              style={{ borderLeft: `3px solid ${statusCfg.borderColor}` }}
            >
              <Avatar name={m.name} avatarUrl={m.avatar_url} size={40} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[14px] font-medium"
                    style={{ fontFamily: "var(--font-body)", color: "var(--ink)" }}
                  >
                    {m.name}
                    {isMe && <span className="ml-1 text-[11px] text-[var(--muted)]">(you)</span>}
                  </span>
                  {m.role === "organizer" && (
                    <span
                      className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--ink)]/8 text-[var(--muted)]"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      Organizer
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusCfg.bg} ${statusCfg.text}`}
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {statusCfg.label}
                  </span>
                  {m.preference_submitted ? (
                    <span
                      className="text-[11px] text-emerald-600 font-medium"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      Survey ✓
                    </span>
                  ) : (
                    <span
                      className="text-[11px] text-[var(--muted)]"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      Survey pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
