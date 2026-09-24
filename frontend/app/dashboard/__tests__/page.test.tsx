import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const get = vi.fn()

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: "authenticated", data: { user: { name: "Gaurav Gupta" } } }),
  signOut: vi.fn(),
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("@/lib/backend-auth", () => ({ ensureBackendToken: async () => "t" }))
vi.mock("@/lib/api", () => ({ api: { get: (...a: unknown[]) => get(...a) } }))

import DashboardLandingPage from "../page"

describe("dashboard trip list", () => {
  beforeEach(() => get.mockReset())

  it("shows an error, not the empty state, when the trips call fails", async () => {
    get.mockImplementationOnce(async () => { throw new Error("503") })
    render(<DashboardLandingPage />)
    const alert = await screen.findByRole("alert")
    expect(alert.textContent).toMatch(/couldn.t load your trips/i)
    expect(screen.queryByText(/nothing charted yet/i)).toBeNull()
    expect(get).toHaveBeenCalledTimes(1)
  })

  it("retries when asked, and renders the trips", async () => {
    get.mockImplementationOnce(async () => { throw new Error("503") }).mockResolvedValueOnce([
      { id: "1", name: "Goa Test", destination: "Goa", start_date: null, end_date: null, status: "planning", trip_type: "beach" },
    ])
    render(<DashboardLandingPage />)
    await userEvent.click(await screen.findByRole("button", { name: /try again/i }))
    await waitFor(() => expect(screen.getByText("Goa Test")).toBeTruthy())
  })

  it("shows the empty state only for a genuinely empty account", async () => {
    get.mockResolvedValue([])
    render(<DashboardLandingPage />)
    expect(await screen.findByText(/nothing charted yet/i)).toBeTruthy()
  })
})
