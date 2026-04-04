"use client"

import { useState } from "react"
import { api } from "@/lib/api"

type Member = {
  user: { id: string; name: string; avatar_url: string | null }
  role: string
  is_creator: boolean
  preference_submitted: boolean
  rsvp_status?: "going" | "maybe" | "declined" | "pending"
  rsvp_updated_at?: string | null
}

type MemberRosterProps = {
  members: Member[]
  myId: string | null
  isOrganizer: boolean
  tripId: string
  onTransfer?: () => void
}

type FilterTab = "all" | "going" | "pending" | "survey"

const RSVP_COLORS: Record<string, string> = {
  going: "var(--accent-pink)",
  maybe: "var(--accent-coral)",
  declined: "var(--muted)",
  pending: "var(--line)",
}

const RSVP_LABELS: Record<string, string> = {
  going: "Going",
  maybe: "Maybe",
  declined: "Can't make it",
  pending: "No response",
}

function avatarColor(name: string) {
  const hues = [210, 160, 20, 280, 340, 60, 190]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return `hsl(${hues[Math.abs(hash) % hues.length]}, 55%, 65%)`
}

export default function MemberRoster({
  members,
  myId,
  isOrganizer,
  tripId,
  onTransfer,
}: MemberRosterProps) {
  const [filter, setFilter] = useState<FilterTab>("all")
  const [transferTo, setTransferTo] = useState("")
  const [transferMsg, setTransferMsg] = useState<string | null>(null)
  const [transferring, setTransferring] = useState(false)

  const counts = {
    going: members.filter((m) => m.rsvp_status === "going").length,
    maybe: members.filter((m) => m.rsvp_status === "maybe").length,
    pending: members.filter((m) => !m.rsvp_status || m.rsvp_status === "pending").length,
    declined: members.filter((m) => m.rsvp_status === "declined").length,
    survey: members.filter((m) => m.preference_submitted).length,
  }

  const filtered = members.filter((m) => {
    if (filter === "going") return m.rsvp_status === "going"
    if (filter === "pending") return !m.rsvp_status || m.rsvp_status === "pending"
    if (filter === "survey") return m.preference_submitted
    return true
  })

  async function handleTransfer() {
    if (!transferTo) return
    setTransferring(true)
    setTransferMsg(null)
    try {
      await api.post(`/trips/${tripId}/members/transfer-organizer`, {
        to_user_id: transferTo,
      })
      setTransferMsg("Leadership transferred successfully.")
      setTransferTo("")
      onTransfer?.()
    } catch {
      setTransferMsg("Could not transfer. Please try again.")
    } finally {
      setTransferring(false)
    }
  }

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: members.length },
    { key: "going", label: "Going", count: counts.going },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "survey", label: "Survey done", count: counts.survey },
  ]

  return (
    <div className="space-y-5">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Going", count: counts.going, color: "var(--accent-pink)" },
          { label: "Maybe", count: counts.maybe, color: "var(--accent-coral)" },
          { label: "Pending", count: counts.pending, color: "var(--muted)" },
          { label: "Declined", count: counts.declined, color: "var(--line)" },
        ].map((chip) => (
          <span
            key={chip.label}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] border border-[var(--line)]"
            style={{ fontFamily: "var(--font-body)", color: "var(--ink)" }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: chip.color }}
            />
            {chip.label} · {chip.count}
          </span>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-[var(--line)]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className="px-3 py-2 text-[12px] transition-colors relative"
            style={{
              fontFamily: "var(--font-body)",
              color: filter === tab.key ? "var(--ink)" : "var(--muted)",
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1 text-[10px] opacity-60">{tab.count}</span>
            )}
            {filter === tab.key && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                style={{ background: "var(--accent-lilac)" }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Member rows */}
      <ul className="space-y-2">
        {filtered.map((m) => {
          const rsvp = m.rsvp_status ?? "pending"
          const isMe = m.user.id === myId
          return (
            <li
              key={m.user.id}
              className="flex items-center gap-3 px-4 py-3 rounded-[4px] border border-[var(--line)] relative overflow-hidden"
              style={{ borderLeft: `3px solid ${RSVP_COLORS[rsvp] ?? "var(--line)"}` }}
            >
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-[13px] font-medium"
                style={{
                  background: m.user.avatar_url ? "transparent" : avatarColor(m.user.name),
                  fontFamily: "var(--font-body)",
                }}
              >
                {m.user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.user.avatar_url}
                    alt={m.user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  m.user.name.charAt(0).toUpperCase()
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[14px] font-medium text-[var(--ink)] truncate"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {m.user.name}
                  {isMe && (
                    <span className="ml-1.5 text-[10px] text-[var(--muted)] font-normal">(you)</span>
                  )}
                </p>
                <p
                  className="text-[11px] text-[var(--muted)] mt-0.5"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {m.role === "organizer" ? "Organizer" : "Member"}
                  {m.is_creator ? " · Trip creator" : ""}
                </p>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-1.5 shrink-0">
                {m.preference_submitted && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--accent-lilac)]/40 text-[var(--accent-lilac)]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    Survey ✓
                  </span>
                )}
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    fontFamily: "var(--font-body)",
                    background: `${RSVP_COLORS[rsvp]}20`,
                    color: RSVP_COLORS[rsvp],
                    border: `1px solid ${RSVP_COLORS[rsvp]}40`,
                  }}
                >
                  {RSVP_LABELS[rsvp]}
                </span>
              </div>
            </li>
          )
        })}
      </ul>

      {filtered.length === 0 && (
        <p
          className="text-[13px] text-[var(--muted)] text-center py-6"
          style={{ fontFamily: "var(--font-body)" }}
        >
          No members in this view.
        </p>
      )}

      {/* Transfer leadership */}
      {isOrganizer && members.length > 1 && (
        <div className="pt-4 border-t border-[var(--line)] space-y-3">
          <p
            className="text-[12px] uppercase tracking-widest text-[var(--muted)]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Transfer leadership
          </p>
          <select
            className="w-full border border-[var(--line)] rounded-[4px] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent-lilac)] transition-colors bg-white"
            style={{ fontFamily: "var(--font-body)", color: "var(--ink)" }}
            value={transferTo}
            onChange={(e) => setTransferTo(e.target.value)}
          >
            <option value="">Choose new organizer…</option>
            {members
              .filter((m) => m.user.id !== myId)
              .map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            className="w-full h-10 rounded-[4px] border border-[var(--ink)] text-[var(--ink)] text-[13px] disabled:opacity-40 transition-opacity"
            style={{ fontFamily: "var(--font-body)" }}
            disabled={!transferTo || transferring}
            onClick={handleTransfer}
          >
            {transferring ? "Transferring…" : "Transfer to selected member"}
          </button>
          {transferMsg && (
            <p
              className="text-[12px] text-[var(--muted)]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {transferMsg}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
