import { describe, expect, it } from "vitest"

import { getTrappedFocusTarget } from "./mobile-drawer-a11y"

describe("mobile drawer accessibility helpers", () => {
  const focusableElements = ["close", "link", "theme"]

  it("wraps focus from the last element to the first element on Tab", () => {
    expect(
      getTrappedFocusTarget({
        activeElement: "theme",
        focusableElements,
        shiftKey: false,
      })
    ).toBe("close")
  })

  it("wraps focus from the first element to the last element on Shift+Tab", () => {
    expect(
      getTrappedFocusTarget({
        activeElement: "close",
        focusableElements,
        shiftKey: true,
      })
    ).toBe("theme")
  })

  it("does not trap when focus is already inside the drawer bounds", () => {
    expect(
      getTrappedFocusTarget({
        activeElement: "link",
        focusableElements,
        shiftKey: false,
      })
    ).toBeUndefined()
  })
})
