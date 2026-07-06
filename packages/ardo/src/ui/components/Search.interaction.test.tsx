// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, useLocation } from "react-router"
import { describe, expect, it, vi } from "vitest"

import { ArdoSearch } from "./Search"

vi.mock("virtual:ardo/search-index", () => ({
  default: [
    {
      id: "getting-started",
      title: "Getting Started",
      content: "Install dependencies and run the development server.",
      path: "/guide/getting-started",
      section: "Guide",
    },
    {
      id: "api",
      title: "API Reference",
      content: "Generated API documentation.",
      path: "/api",
      section: "Reference",
    },
  ],
}))

function PathProbe() {
  const location = useLocation()
  return <output aria-label="current path">{location.pathname}</output>
}

function renderSearch() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <ArdoSearch />
      <PathProbe />
    </MemoryRouter>
  )
}

describe("ArdoSearch interactions", () => {
  it("opens results, supports keyboard selection, and navigates on Enter", async () => {
    const user = userEvent.setup()
    renderSearch()

    await user.type(screen.getByRole("combobox", { name: "Search" }), "install")

    expect(await screen.findByRole("option", { name: /Getting Started/ })).toBeTruthy()

    await user.keyboard("{Enter}")

    expect(screen.getByLabelText("current path").textContent).toBe("/guide/getting-started")
  })

  it("closes the popover on Escape", async () => {
    const user = userEvent.setup()
    renderSearch()

    await user.type(screen.getByRole("combobox", { name: "Search" }), "api")
    expect(await screen.findByRole("listbox", { name: "Search results" })).toBeTruthy()

    await user.keyboard("{Escape}")

    expect(screen.queryByRole("listbox", { name: "Search results" })).toBeNull()
  })
})
