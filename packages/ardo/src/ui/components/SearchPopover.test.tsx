// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react"
import { useRef } from "react"
import { describe, expect, it } from "vitest"

import { SearchPopover } from "./SearchPopover"
import { getSearchPopoverPosition } from "./search-popover-position"

function ModalSearch() {
  const anchorRef = useRef<HTMLDivElement>(null)
  return (
    <div role="dialog" aria-modal="true" aria-label="Search">
      <div ref={anchorRef}>Search input</div>
      <SearchPopover anchorRef={anchorRef}>
        <ul role="listbox" aria-label="Results" />
      </SearchPopover>
    </div>
  )
}

describe("SearchPopover", () => {
  it("keeps the result viewport and footer inside a short landscape viewport", () => {
    const position = getSearchPopoverPosition(
      { bottom: 60, left: 16, width: 768 },
      { width: 844, height: 390, top: 0, left: 0 }
    )

    expect(position.top + position.maxHeight).toBe(374)
    expect(position.maxHeight).toBe(306)
  })

  it("uses the visible viewport after a software keyboard or viewport pan", () => {
    const position = getSearchPopoverPosition(
      { bottom: 160, left: 0, width: 500 },
      { width: 390, height: 300, top: 100, left: 20 }
    )

    expect(position).toStrictEqual({ top: 168, left: 36, width: 358, maxHeight: 216 })
  })

  it("portals results into their modal dialog rather than outside its accessible subtree", () => {
    render(<ModalSearch />)

    expect(
      within(screen.getByRole("dialog")).getByRole("listbox", { name: "Results" })
    ).toBeTruthy()
  })
})
