import { describe, expect, it } from "vitest"
import { tallyOf } from "../votes"

describe("tallyOf", () => {
  it("returns the tally from the vote state the API sends", () => {
    const state = { options: ["Goa", "Gokarna"], tally: { Goa: 2 }, total: 2, my_vote: "Goa" }
    expect(tallyOf(state)).toEqual({ Goa: 2 })
  })

  it("returns an empty tally when the state has none", () => {
    expect(tallyOf({ options: [], total: 0, my_vote: null })).toEqual({})
    expect(tallyOf(null)).toEqual({})
    expect(tallyOf(undefined)).toEqual({})
  })
})
