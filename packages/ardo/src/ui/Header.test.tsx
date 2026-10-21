// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ArdoProvider } from "../runtime/hooks"
import { ArdoLink, ArdoPageProvider } from "../runtime/page"
import { ArdoHeader } from "./Header"

vi.mock("./components/Search", () => ({
  ArdoSearch: () => <input aria-label="Search input" />,
}))

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
