import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import OptionTile from "../OptionTile"

describe("OptionTile", () => {
  it("renders label and description", () => {
    render(
      <OptionTile label="Beach trip" description="Relaxed, low-effort" selected={false} onClick={() => {}} />,
    )
    expect(screen.getByText("Beach trip")).toBeInTheDocument()
    expect(screen.getByText("Relaxed, low-effort")).toBeInTheDocument()
  })

  it("calls onClick when the tile is clicked", async () => {
    const onClick = vi.fn()
    render(<OptionTile label="Beach trip" selected={false} onClick={onClick} />)
    await userEvent.click(screen.getByRole("button"))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("does not call onClick when disabled", async () => {
    const onClick = vi.fn()
    render(<OptionTile label="Beach trip" selected={false} onClick={onClick} disabled />)
    await userEvent.click(screen.getByRole("button"))
    expect(onClick).not.toHaveBeenCalled()
  })

  it("shows a check mark only when selected", () => {
    const { rerender } = render(<OptionTile label="Beach trip" selected={false} onClick={() => {}} />)
    expect(screen.queryByText("✓")).not.toBeInTheDocument()

    rerender(<OptionTile label="Beach trip" selected onClick={() => {}} />)
    expect(screen.getByText("✓")).toBeInTheDocument()
  })
})
