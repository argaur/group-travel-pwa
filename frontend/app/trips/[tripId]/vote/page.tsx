"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { api } from "@/lib/api"
import { connectTripStream } from "@/lib/sse"
import { ensureBackendToken, getBackendUserId } from "@/lib/backend-auth"
import AppShell from "@/components/AppShell"
import TripPlanningGate from "@/components/TripPlanningGate"
import VoteCard from "@/components/votes/VoteCard"
import CreateVoteForm from "@/components/votes/CreateVoteForm"

type MemberRow = {
  user: { id: string; name: string }
  role: string
  preference_submitted: boolean
}

const VOTE_TOPICS = [
  {
    type: "destination",
    label: "Destination",
    description: "Where should the group go?",
    placeholder: "e.g. Goa, Manali, Coorg",
  },
  {
    type: "dates",
    label: "Dates",
    description: "When works for everyone?",
    placeholder: "e.g. July 14–16, Aug first week",
  },
  {
    type: "accommodation",
    label: "Accommodation",
    description: "What kind of stay?",
    placeholder: "e.g. Airbnb villa, Beach resort, Budget hostel",
  },
] as const

type VoteData = {
  options: string[]
  tally: Record<string, number>
  total: number
  my_vote: string | null
}

const EMPTY_VOTE: VoteData = { options: [], tally: {}, total: 0, my_vote: null }

function VotePageContent() {
  const params = useParams<{ tripId: string }>()
  const [members, setMembers] = useState<MemberRow[]>([])
  const [tallies, setTallies] = useState<Record<string, Record<string, number>>>({})
  // Options are the ballot the organizer published (persisted server-side), not tally keys
  const [optionSets, setOptionSets] = useState<Record<string, string[]>>({})
  const [myVotes, setMyVotes] = useState<Record<string, string | null>>({})
  const [loading, setLoading] = useState(true)

  const myId = getBackendUserId()
  const isOrganizer = useMemo(
    () => members.find((m) => m.user.id === myId)?.role === "organizer",
    [members, myId],
  )

  const load = useCallback(async () => {
    await ensureBackendToken()
    const [mems, ...voteResults] = await Promise.all([
      api.get<MemberRow[]>(`/trips/${params.tripId}/members`),
      ...VOTE_TOPICS.map((t) =>
        api
          .get<VoteData>(`/trips/${params.tripId}/votes/${t.type}`)
          .catch(() => EMPTY_VOTE)
      ),
    ])
    setMembers(mems)

    const newTallies: Record<string, Record<string, number>> = {}
    const newOptionSets: Record<string, string[]> = {}
    const newMyVotes: Record<string, string | null> = {}
    VOTE_TOPICS.forEach((t, i) => {
      const data = (voteResults[i] as VoteData) ?? EMPTY_VOTE
      newTallies[t.type] = data.tally
      newOptionSets[t.type] = data.options
      newMyVotes[t.type] = data.my_vote
    })
    setTallies(newTallies)
    setOptionSets(newOptionSets)
    setMyVotes(newMyVotes)
    setLoading(false)
  }, [params.tripId])

  useEffect(() => {
    load()
  }, [load])

  // SSE — reload on vote_cast events
  useEffect(() => {
    const disconnect = connectTripStream(params.tripId, (event) => {
      if (event.type === "vote_cast") {
        load().catch(() => {})
      }
    })
    return disconnect
  }, [params.tripId, load])

  const totalResponded = members.filter((m) => m.preference_submitted).length
  const totalMembers = members.length

  return (
    <AppShell
      tripId={params.tripId}
      active="vote"
      title="Group decisions"
      subtitle={`${totalResponded} of ${totalMembers} members have submitted preferences`}
    >
      {loading ? (
        <p className="text-sm text-[var(--muted)]">Loading votes…</p>
      ) : (
        <div className="space-y-8 max-w-2xl">
          {/* Intro */}
          <div className="space-y-1">
            <p
              className="text-[13px] text-[var(--muted)]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Vote to move the trip forward. Everyone gets one vote per topic.
              {isOrganizer && " As organizer, you can add options for the group to vote on."}
            </p>
          </div>

          {/* Vote sections */}
          {VOTE_TOPICS.map((topic) => {
            const tally = tallies[topic.type] ?? {}
            const options = optionSets[topic.type] ?? []
            const hasOptions = options.length > 0

            return (
              <section key={topic.type} className="space-y-3">
                {/* Section label */}
                <div className="flex items-center gap-3">
                  <p
                    className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {topic.description}
                  </p>
                  <div className="flex-1 h-px bg-[var(--line)]" />
                </div>

                {/* Vote card — only if there are options */}
                {hasOptions && (
                  <VoteCard
                    tripId={params.tripId}
                    voteType={topic.type}
                    label={topic.label}
                    options={options}
                    tally={tally}
                    currentVote={myVotes[topic.type] ?? undefined}
                    onVoteCast={load}
                  />
                )}

                {/* Empty state for non-organizers */}
                {!hasOptions && !isOrganizer && (
                  <div
                    className="border border-[var(--line)] rounded-[4px] px-5 py-4"
                    style={{ borderLeft: "3px solid var(--accent-lilac)" }}
                  >
                    <p className="text-sm text-[var(--muted)]">
                      The organizer hasn't added options yet.
                    </p>
                  </div>
                )}

                {/* Organizer form */}
                {isOrganizer && (
                  <CreateVoteForm
                    tripId={params.tripId}
                    voteType={topic.type}
                    onCreated={load}
                  />
                )}
              </section>
            )
          })}

          {/* Member participation status */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <p
                className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Participation
              </p>
              <div className="flex-1 h-px bg-[var(--line)]" />
            </div>
            <div
              className="border border-[var(--line)] rounded-[4px] px-5 py-4 space-y-3"
              style={{ borderLeft: "3px solid var(--accent-lilac)" }}
            >
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-[var(--muted)]">
                  <span>Preferences submitted</span>
                  <span className="tabular-nums">{totalResponded} / {totalMembers}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--line)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: totalMembers > 0 ? `${(totalResponded / totalMembers) * 100}%` : "0%",
                      background: "linear-gradient(90deg, var(--accent-coral), var(--accent-pink))",
                    }}
                  />
                </div>
              </div>
              {/* Member list */}
              <ul className="space-y-1.5">
                {members.map((m) => (
                  <li
                    key={m.user.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span style={{ fontFamily: "var(--font-body)" }}>
                      {m.user.name}
                      {m.role === "organizer" && (
                        <span className="ml-1.5 text-[10px] text-[var(--muted)] uppercase tracking-wider">
                          organizer
                        </span>
                      )}
                    </span>
                    {m.preference_submitted ? (
                      <span className="text-xs text-emerald-600 font-medium">Survey ✓</span>
                    ) : (
                      <span className="text-xs text-[var(--muted)]">Pending</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  )
}

export default function VotePage() {
  const params = useParams<{ tripId: string }>()
  return (
    <TripPlanningGate tripId={params.tripId}>
      <VotePageContent />
    </TripPlanningGate>
  )
}
