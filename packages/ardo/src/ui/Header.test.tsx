// @vitest-environment jsdom

import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ArdoProvider } from "../runtime/hooks"
import { ArdoLink, ArdoPageProvider } from "../runtime/page"
import { ArdoHeader } from "./Header"
import { getSearchRecoveryQuery } from "./components/search-recovery"
import { type ArdoHeaderSearchMode, resolveHeaderSearch } from "./header-search-mode"
import { type ArdoLayoutVariant, ArdoLayoutVariantContext } from "./layout-context"

vi.mock("./components/Search", () => ({
  ArdoSearch: () => <input aria-label="Search input" />,
}))

vi.mock("./components/search-recovery", () => ({ getSearchRecoveryQuery: vi.fn() }))

function HeaderPage({ path }: { path: string }) {
  return (
    <ArdoPageProvider path={path}>
      <ArdoProvider config={{ title: "Docs" }} sidebar={[]}>
        <ArdoHeader search themeToggle={false}>
          <ArdoLink to="/next">Next page</ArdoLink>
        </ArdoHeader>
      </ArdoProvider>
    </ArdoPageProvider>
  )
}

describe("ArdoHeader page state", () => {
  it("reopens and focuses the search dialog for a pending reload query", async () => {
    vi.mocked(getSearchRecoveryQuery).mockReturnValueOnce("install")
    render(<HeaderPage path="/start" />)

    const dialog = await screen.findByRole("dialog", { name: "Search" })
    expect(document.activeElement).toBe(within(dialog).getByLabelText("Search input"))
  })

  it("shows and initially focuses the site title when the mobile drawer has no logo", async () => {
    const user = userEvent.setup()
    render(<HeaderPage path="/start" />)

    await user.click(screen.getByRole("button", { name: "Toggle menu" }))

    const menu = screen.getByRole("dialog", { name: "Docs navigation menu" })
    const home = within(menu).getByRole("link", { name: "Docs" })
    expect(home.textContent).toBe("Docs")
    expect(document.activeElement).toBe(home)
  })

  it("links with the base path and closes the mobile menu when the page changes", async () => {
    const user = userEvent.setup()
    const view = render(<HeaderPage path="/start" />)

    await user.click(screen.getByRole("button", { name: "Toggle menu" }))
    const menu = screen.getByRole("dialog", { name: "Docs navigation menu" })
    expect(within(menu).getByRole("link", { name: "Next page" }).getAttribute("href")).toBe(
      "/next/"
    )

    view.rerender(<HeaderPage path="/next" />)
    expect(screen.queryByRole("dialog", { name: "Docs navigation menu" })).toBeNull()

    await user.click(screen.getByRole("button", { name: "Toggle menu" }))
    expect(screen.getByRole("dialog", { name: "Docs navigation menu" })).toBeTruthy()
  })

  it("closes the search overlay when the page changes and allows reopening", async () => {
    const user = userEvent.setup()
    const view = render(<HeaderPage path="/start" />)

    await user.click(screen.getByRole("button", { name: "Search" }))
    expect(screen.getByRole("dialog", { name: "Search" })).toBeTruthy()

    view.rerender(<HeaderPage path="/next" />)
    expect(screen.queryByRole("dialog", { name: "Search" })).toBeNull()

    await user.click(screen.getByRole("button", { name: "Search" }))
    expect(screen.getByRole("dialog", { name: "Search" })).toBeTruthy()
  })
})

function renderSearchHeader(layout: ArdoLayoutVariant, search?: ArdoHeaderSearchMode) {
  render(
    <ArdoPageProvider path="/start">
      <ArdoProvider config={{ title: "Docs" }} sidebar={[]}>
        <ArdoLayoutVariantContext value={layout}>
          <ArdoHeader search={search} themeToggle={false} />
        </ArdoLayoutVariantContext>
      </ArdoProvider>
    </ArdoPageProvider>
  )
}

function pressSearchShortcut() {
  fireEvent.keyDown(document, { key: "k", metaKey: true })
}

describe("ArdoHeader search modes", () => {
  it("resolves auto from the layout and keeps explicit modes", () => {
    expect(resolveHeaderSearch("auto", "doc")).toBe("field")
    expect(resolveHeaderSearch("auto", "bare")).toBe("icon")
    expect(resolveHeaderSearch(true, "bare")).toBe("icon")
    expect(resolveHeaderSearch("field", "bare")).toBe("field")
    expect(resolveHeaderSearch("icon", "doc")).toBe("icon")
    expect(resolveHeaderSearch(false, "doc")).toBe("none")
  })

  it("shows the search field on docs pages and focuses it on ⌘K", () => {
    renderSearchHeader("doc")

    const input = screen.getByLabelText("Search input")
    pressSearchShortcut()

    expect(input.matches(":focus")).toBe(true)
    expect(screen.queryByRole("dialog", { name: "Search" })).toBeNull()
  })

  it("collapses search to an icon on bare pages and opens the overlay on ⌘K", () => {
    renderSearchHeader("bare")

    expect(screen.queryByLabelText("Search input")).toBeNull()
    const trigger = screen.getByRole("button", { name: "Search" })
    expect(trigger.getAttribute("aria-keyshortcuts")).toBe("Meta+K Control+K")

    pressSearchShortcut()
    const dialog = screen.getByRole("dialog", { name: "Search" })
    expect(within(dialog).getByLabelText("Search input")).toBeTruthy()
  })

  it("lets the search prop override the layout", () => {
    renderSearchHeader("bare", "field")

    expect(screen.getByLabelText("Search input")).toBeTruthy()
  })
})
