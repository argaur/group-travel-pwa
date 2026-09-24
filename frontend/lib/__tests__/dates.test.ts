import { describe, expect, it } from "vitest"
import { tripDatesError } from "../dates"

describe("tripDatesError", () => {
  it("rejects an end date before the start date", () => {
    expect(tripDatesError("2026-08-13", "2026-07-26")).toMatch(/before the start/)
  })
  it("allows a same-day trip", () => {
    expect(tripDatesError("2026-08-13", "2026-08-13")).toBeNull()
  })
  it("allows open-ended or empty dates", () => {
    expect(tripDatesError("2026-08-13", "")).toBeNull()
    expect(tripDatesError("", "2026-08-13")).toBeNull()
    expect(tripDatesError("", "")).toBeNull()
  })
})
