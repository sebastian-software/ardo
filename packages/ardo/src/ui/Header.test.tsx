// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Link, MemoryRouter, useLocation, useNavigate } from "react-router"
import { describe, expect, it, vi } from "vitest"

import { ArdoProvider } from "../runtime/hooks"
import { ArdoHeader } from "./Header"

vi.mock("./components/Search", () => ({
  ArdoSearch: () => <input aria-label="Search input" />,
}))

function HeaderHarness() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <ArdoProvider config={{ title: "Docs" }} sidebar={[]}>
      <ArdoHeader search themeToggle={false}>
        <Link to="/next">Next page</Link>
      </ArdoHeader>
      <button
        type="button"
        onClick={() => {
          void navigate("/next")
        }}
      >
        Navigate next
      </button>
      <button
        type="button"
        onClick={() => {
          void navigate(-1)
        }}
      >
        Back
      </button>
      <output aria-label="current path">{location.pathname}</output>
    </ArdoProvider>
  )
}

function renderHeader() {
  render(
    <MemoryRouter initialEntries={["/start"]}>
      <HeaderHarness />
    </MemoryRouter>
  )
}

describe("ArdoHeader navigation state", () => {
  it("closes the mobile menu on navigation and allows reopening after going back", async () => {
    const user = userEvent.setup()
    renderHeader()

    await user.click(screen.getByRole("button", { name: "Toggle menu" }))
    const menu = screen.getByRole("dialog", { name: "Docs navigation menu" })
    await user.click(within(menu).getByRole("link", { name: "Next page" }))

    expect(screen.getByLabelText("current path").textContent).toBe("/next")
    expect(screen.queryByRole("dialog", { name: "Docs navigation menu" })).toBeNull()

    await user.click(screen.getByRole("button", { name: "Back" }))
    expect(screen.getByLabelText("current path").textContent).toBe("/start")
    expect(screen.queryByRole("dialog", { name: "Docs navigation menu" })).toBeNull()

    await user.click(screen.getByRole("button", { name: "Toggle menu" }))
    expect(screen.getByRole("dialog", { name: "Docs navigation menu" })).toBeTruthy()
  })

  it("closes the search overlay on navigation and allows reopening", async () => {
    const user = userEvent.setup()
    renderHeader()

    await user.click(screen.getByRole("button", { name: "Search" }))
    expect(screen.getByRole("dialog", { name: "Search" })).toBeTruthy()

    await user.click(screen.getByRole("button", { name: "Navigate next" }))
    expect(screen.getByLabelText("current path").textContent).toBe("/next")
    expect(screen.queryByRole("dialog", { name: "Search" })).toBeNull()

    await user.click(screen.getByRole("button", { name: "Back" }))
    expect(screen.getByLabelText("current path").textContent).toBe("/start")
    expect(screen.queryByRole("dialog", { name: "Search" })).toBeNull()

    await user.click(screen.getByRole("button", { name: "Search" }))
    expect(screen.getByRole("dialog", { name: "Search" })).toBeTruthy()
  })
})
