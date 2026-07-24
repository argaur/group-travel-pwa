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

/* Status → ink density. One hot accent: only "going" runs vermillion. */
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  going: { label: "Going", color: "var(--accent)" },
  maybe: { label: "Maybe", color: "var(--ink)" },
  declined: { label: "Declined", color: "var(--ink-40)" },
  pending: { label: "Pending", color: "var(--ink-15)" },
}

type FilterTab = "all" | "going" | "pending" | "survey_done"

function Avatar({ name, avatarUrl, size = 40 }: { name: string; avatarUrl: string | null; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="object-cover shrink-0"
        style={{ width: size, height: size, filter: "saturate(0.85)", border: "1.5px solid var(--ink)" }}
      />
    )
  }
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        background: "var(--ink)",
        color: "var(--paper)",
        fontFamily: "var(--mono)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.05em",
      }}
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
          { label: `${counts.going} Going`, hot: true },
          { label: `${counts.maybe} Maybe`, hot: false },
          { label: `${counts.pending} Pending`, hot: false },
          { label: `${counts.declined} Declined`, hot: false },
        ].map((chip) => (
          <span key={chip.label} className={`chip${chip.hot ? " hot" : ""}`}>
            {chip.label}
          </span>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1" style={{ borderBottom: "1px solid var(--ink-15)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className="px-3 py-2 -mb-px transition-colors duration-100"
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              borderBottom: "2px solid",
              borderBottomColor: filter === tab.id ? "var(--accent)" : "transparent",
              color: filter === tab.id ? "var(--ink)" : "var(--ink-60)",
              fontWeight: filter === tab.id ? 700 : 500,
            }}
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
          <p className="m-label py-4">Nobody charted in this category</p>
        )}
        {filtered.map((m) => {
          const statusCfg = STATUS_CONFIG[m.rsvp_status] ?? STATUS_CONFIG.pending
          const isMe = m.user_id === currentUserId
          return (
            <div
              key={m.user_id}
              className="stagger-child card flat px-4 py-3 flex items-center gap-3"
              style={{ borderLeftWidth: 3, borderLeftColor: statusCfg.color }}
            >
              <Avatar name={m.name} avatarUrl={m.avatar_url} size={40} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[15px]"
                    style={{ fontFamily: "var(--body)", fontWeight: 600, color: "var(--ink)" }}
                  >
                    {m.name}
                    {isMe && <span className="ml-1 m-label">(you)</span>}
                  </span>
                  {m.role === "organizer" && (
                    <span className="chip">Organizer</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span
                    className="chip"
                    style={{ borderColor: statusCfg.color, color: m.rsvp_status === "going" ? "var(--accent)" : "var(--ink-60)" }}
                  >
                    {statusCfg.label}
                  </span>
                  {m.preference_submitted ? (
                    <span className="m-label" style={{ color: "var(--accent)", fontWeight: 700 }}>◆ Survey in</span>
                  ) : (
                    <span className="m-label" style={{ color: "var(--ink-40)" }}>○ Survey due</span>
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
