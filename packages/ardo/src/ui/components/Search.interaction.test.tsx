// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type * as pageContext from "../../runtime/page-context"
import type * as searchIndexModule from "./search-index"

import { ArdoPageProvider } from "../../runtime/page"
import { navigateTo } from "../../runtime/page-context"
import { ArdoSiteConfigProvider } from "../../runtime/hooks"
import { resolveArdoLabels } from "../labels"
import { ArdoSearch } from "./Search"
import { loadSearchIndex } from "./search-index"
import { consumeSearchRecoveryQuery, reloadSearch } from "./search-recovery"

vi.mock("./search-recovery", () => ({
  consumeSearchRecoveryQuery: vi.fn(),
  reloadSearch: vi.fn(),
}))

vi.mock("./search-index", async (importOriginal) => {
  const original = await importOriginal<typeof searchIndexModule>()
  return { ...original, loadSearchIndex: vi.fn(original.loadSearchIndex) }
})

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
  it("preserves a failed query when requesting a reload with localized recovery labels", async () => {
    const user = userEvent.setup()
    vi.mocked(loadSearchIndex)
      .mockRejectedValueOnce(new Error("Prefetch unavailable"))
      .mockRejectedValueOnce(new Error("Request unavailable"))
    render(
      <ArdoPageProvider>
        <ArdoSiteConfigProvider
          value={{
            labels: resolveArdoLabels({
              search: {
                loadError: "Search is temporarily unavailable.",
                retry: "Reload documentation search",
              },
            }),
          }}
        >
          <ArdoSearch />
        </ArdoSiteConfigProvider>
      </ArdoPageProvider>
    )
    const input = screen.getByRole("combobox", { name: "Search" })
    await user.click(input)
    fireEvent.change(input, { target: { value: "install" } })

    expect(screen.getByRole("status").textContent).toBe("Searching…")
    expect(await screen.findByRole("button", { name: "Reload documentation search" })).toBeTruthy()
    expect(screen.getByRole("status").textContent).toBe("Search is temporarily unavailable.")
    expect(input.getAttribute("value")).toBe("install")
    expect(screen.queryByText(/No results found/)).toBeNull()

    await user.click(screen.getByRole("button", { name: "Reload documentation search" }))
    expect(reloadSearch).toHaveBeenCalledWith("install")
  })

  it("restores the query and input focus after search reloads", async () => {
    const rect = new DOMRect(0, 0, 300, 40)
    const bounds = Object.assign([rect], { item: () => rect })
    const visibleInput = vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue(bounds)
    vi.mocked(consumeSearchRecoveryQuery).mockReturnValueOnce("install")
    renderSearch()

    expect(await screen.findByRole("option", { name: /Getting Started/ })).toBeTruthy()
    const input = screen.getByRole("combobox", { name: "Search" })
    expect(input.getAttribute("value")).toBe("install")
    expect(document.activeElement).toBe(input)
    visibleInput.mockRestore()
  })

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
