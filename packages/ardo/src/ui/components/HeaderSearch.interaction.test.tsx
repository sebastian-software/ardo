// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"

import { ArdoPageProvider } from "../../runtime/page"
import { ArdoHeaderSearch } from "./HeaderSearch"

afterEach(() => {
  cleanup()
  document.body.style.overflow = ""
})

describe("ArdoHeaderSearch overlay", () => {
  it("restores the page's previous body overflow when the overlay closes", async () => {
    const user = userEvent.setup()
    document.body.style.overflow = "clip"
    render(
      <ArdoPageProvider>
        <ArdoHeaderSearch variant="icon" />
      </ArdoPageProvider>
    )

    await user.click(screen.getByRole("button", { name: "Search" }))
    expect(document.body.style.overflow).toBe("hidden")

    await user.click(screen.getByRole("button", { name: "Close search" }))
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(document.body.style.overflow).toBe("clip")
  })
})
