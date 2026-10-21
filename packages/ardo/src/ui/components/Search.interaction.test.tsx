// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type * as pageContext from "../../runtime/page-context"

import { ArdoPageProvider } from "../../runtime/page"
import { navigateTo } from "../../runtime/page-context"
import { ArdoSearch } from "./Search"

vi.mock("../../runtime/page-context", async (importOriginal) => ({
  ...(await importOriginal<typeof pageContext>()),
  navigateTo: vi.fn<(href: string) => void>(),
}))

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

function renderSearch() {
  render(
    <ArdoPageProvider base="/docs/">
      <ArdoSearch />
    </ArdoPageProvider>
  )
}

describe("ArdoSearch interactions", () => {
  it("focuses the search input when autoFocus is enabled", async () => {
    const user = userEvent.setup()
    render(
      <ArdoPageProvider>
        <ArdoSearch autoFocus />
      </ArdoPageProvider>
    )

    await user.keyboard("install")

    expect(await screen.findByRole("option", { name: /Getting Started/ })).toBeTruthy()
  })

  it("opens results, supports keyboard selection, and navigates on Enter", async () => {
    const user = userEvent.setup()
    renderSearch()

    await user.type(screen.getByRole("combobox", { name: "Search" }), "install")

    expect(await screen.findByRole("option", { name: /Getting Started/ })).toBeTruthy()

    await user.keyboard("{Enter}")

    expect(vi.mocked(navigateTo)).toHaveBeenCalledWith("/docs/guide/getting-started/")
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
