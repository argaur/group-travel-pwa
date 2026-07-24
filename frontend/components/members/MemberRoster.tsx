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

/* Status → ink density. One hot accent: only "going" runs vermillion. */
const RSVP_COLORS: Record<string, string> = {
  going: "var(--accent)",
  maybe: "var(--ink)",
  declined: "var(--ink-40)",
  pending: "var(--ink-15)",
}

const RSVP_LABELS: Record<string, string> = {
  going: "Going",
  maybe: "Maybe",
  declined: "Can't make it",
  pending: "No response",
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
          { label: "Going", count: counts.going, hot: true },
          { label: "Maybe", count: counts.maybe, hot: false },
          { label: "Pending", count: counts.pending, hot: false },
          { label: "Declined", count: counts.declined, hot: false },
        ].map((chip) => (
          <span key={chip.label} className={`chip${chip.hot ? " hot" : ""}`}>
            {chip.label} · {chip.count}
          </span>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1" style={{ borderBottom: "1px solid var(--ink-15)" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className="px-3 py-2 -mb-px transition-colors relative"
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              borderBottom: "2px solid",
              borderBottomColor: filter === tab.key ? "var(--accent)" : "transparent",
              color: filter === tab.key ? "var(--ink)" : "var(--ink-60)",
              fontWeight: filter === tab.key ? 700 : 500,
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1 opacity-60">{tab.count}</span>
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
              className="card flat flex items-center gap-3 px-4 py-3 relative overflow-hidden"
              style={{ borderLeftWidth: 3, borderLeftColor: RSVP_COLORS[rsvp] ?? "var(--ink-15)" }}
            >
              {/* Avatar — squared ink specimen */}
              <div
                className="shrink-0 flex items-center justify-center overflow-hidden"
                style={{
                  width: 36,
                  height: 36,
                  background: m.user.avatar_url ? "transparent" : "var(--ink)",
                  color: "var(--paper)",
                  fontFamily: "var(--mono)",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {m.user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.user.avatar_url}
                    alt={m.user.name}
                    className="w-full h-full object-cover"
                    style={{ filter: "saturate(0.85)" }}
                  />
                ) : (
                  m.user.name.charAt(0).toUpperCase()
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[15px] truncate" style={{ fontFamily: "var(--body)", fontWeight: 600, color: "var(--ink)" }}>
                  {m.user.name}
                  {isMe && <span className="ml-1.5 m-label">(you)</span>}
                </p>
                <p className="m-label mt-0.5" style={{ letterSpacing: "0.12em" }}>
                  {m.role === "organizer" ? "Organizer" : "Member"}
                  {m.is_creator ? " · Trip creator" : ""}
                </p>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-1.5 shrink-0">
                {m.preference_submitted && (
                  <span className="chip hot">Survey ◆</span>
                )}
                <span
                  className="chip"
                  style={{ borderColor: RSVP_COLORS[rsvp], color: rsvp === "going" ? "var(--accent)" : "var(--ink-60)" }}
                >
                  {RSVP_LABELS[rsvp]}
                </span>
              </div>
            </li>
          )
        })}
      </ul>

      {filtered.length === 0 && (
        <p className="m-label text-center py-6">Nobody charted in this view</p>
      )}

      {/* Transfer leadership */}
      {isOrganizer && members.length > 1 && (
        <div className="pt-4 space-y-3" style={{ borderTop: "2px solid var(--ink)" }}>
          <p className="field-label">Transfer leadership</p>
          <select
            className="field-select"
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
            className="cta sm w-full"
            disabled={!transferTo || transferring}
            onClick={handleTransfer}
          >
            {transferring ? "Transferring…" : "Transfer to selected member"}
          </button>
          {transferMsg && (
            <p className="m-label">{transferMsg}</p>
          )}
        </div>
      )}
    </div>
  )
}
