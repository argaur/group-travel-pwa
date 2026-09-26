/** Vote state as GET /trips/{id}/votes/{type} returns it. */
export interface VoteState {
  options?: string[]
  tally?: Record<string, number>
  total?: number
  my_vote?: string | null
}

/** The option -> count map inside a vote state, empty when there is none. */
export function tallyOf(state: VoteState | null | undefined): Record<string, number> {
  return state?.tally ?? {}
}
