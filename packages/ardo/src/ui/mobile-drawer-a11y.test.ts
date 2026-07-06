import { describe, expect, it } from "vitest"

import type { FocusableElementCandidate } from "./mobile-drawer-a11y"

import { getTrappedFocusTarget, isFocusableElement } from "./mobile-drawer-a11y"

type TestFocusableElement = {
  testId: string
} & FocusableElementCandidate

function createFocusableElement({
  ariaHidden,
  disabled = false,
  inert = false,
  testId,
}: {
  ariaHidden?: string
  disabled?: boolean
  inert?: boolean
  testId: string
}): TestFocusableElement {
  return {
    closest: (selector) => (selector === "[inert]" && inert ? {} : null),
    getAttribute: (name) => (name === "aria-hidden" ? (ariaHidden ?? null) : null),
    hasAttribute: (name) => name === "disabled" && disabled,
    testId,
  }
}

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

  it("excludes disabled, aria-hidden, and inert subtree elements from focus traps", () => {
    const elements = [
      createFocusableElement({ testId: "close" }),
      createFocusableElement({ inert: true, testId: "hidden-link" }),
      createFocusableElement({ ariaHidden: "true", testId: "hidden-button" }),
      createFocusableElement({ disabled: true, testId: "disabled-button" }),
      createFocusableElement({ testId: "visible-link" }),
    ]

    expect(elements.filter(isFocusableElement).map((element) => element.testId)).toStrictEqual([
      "close",
      "visible-link",
    ])
  })
})
