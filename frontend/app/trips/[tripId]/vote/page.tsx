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
        <div className="max-w-md">
          <p className="m-label mb-3">Plotting the ballot…</p>
          <div className="skeleton-hatch h-4 w-full mb-2" />
          <div className="skeleton-hatch h-4 w-4/5" />
        </div>
      ) : (
        <div className="space-y-8 max-w-2xl">
          {/* Intro */}
          <div className="space-y-1">
            <p className="text-[14px]" style={{ fontFamily: "var(--body)", color: "var(--ink-60)" }}>
              Vote to move the trip forward. Everyone gets one vote per topic.
              {isOrganizer && " As organizer, you can add options for the group to vote on."}
            </p>
          </div>

          {/* Vote sections */}
          {VOTE_TOPICS.map((topic, i) => {
            const tally = tallies[topic.type] ?? {}
            const options = optionSets[topic.type] ?? []
            const hasOptions = options.length > 0

            return (
              <section key={topic.type} className="space-y-3">
                {/* Section label */}
                <div className="flex items-center gap-3">
                  <span className="fig-tag" style={{ flexShrink: 0 }}>
                    <b>№ {String(i + 1).padStart(2, "0")}</b> {topic.description}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "var(--ink-15)" }} />
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
                  <div className="card flat px-5 py-4" style={{ borderLeftWidth: 3, borderLeftColor: "var(--accent)" }}>
                    <p className="m-label">The organizer hasn&apos;t charted options yet</p>
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
              <span className="fig-tag" style={{ flexShrink: 0 }}>
                <b>◆</b> Participation
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--ink-15)" }} />
            </div>
            <div className="card flat px-5 py-4 space-y-3">
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between m-label">
                  <span>Preferences submitted</span>
                  <span className="tabular-nums" style={{ color: "var(--accent)", fontWeight: 700 }}>{totalResponded} / {totalMembers}</span>
                </div>
                <div className="h-1.5 overflow-hidden" style={{ background: "var(--ink-08)" }}>
                  <div
                    className="h-full transition-[width] duration-500"
                    style={{
                      width: totalMembers > 0 ? `${(totalResponded / totalMembers) * 100}%` : "0%",
                      background: "var(--accent)",
                    }}
                  />
                </div>
              </div>
              {/* Member list */}
              <ul>
                {members.map((m) => (
                  <li
                    key={m.user.id}
                    className="flex items-center justify-between text-sm py-2.5"
                    style={{ borderTop: "1px dashed var(--ink-15)" }}
                  >
                    <span style={{ fontFamily: "var(--body)", color: "var(--ink)" }}>
                      {m.user.name}
                      {m.role === "organizer" && (
                        <span className="ml-2 m-label">organizer</span>
                      )}
                    </span>
                    {m.preference_submitted ? (
                      <span className="m-label" style={{ color: "var(--accent)", fontWeight: 700 }}>◆ Survey in</span>
                    ) : (
                      <span className="m-label" style={{ color: "var(--ink-40)" }}>○ Pending</span>
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
