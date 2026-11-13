// @vitest-environment jsdom

import { describe, expect, it } from "vitest"

import type { FocusableElementCandidate } from "./mobile-drawer-a11y"

import { getTrappedFocusTarget, isFocusableElement, trapFocus } from "./mobile-drawer-a11y"

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

    expect(
      elements.filter((element) => isFocusableElement(element)).map((element) => element.testId)
    ).toStrictEqual(["close", "visible-link"])
  })
})

describe("trapFocus", () => {
  function setup() {
    document.body.innerHTML = `
      <button id="page">Page behind</button>
      <div id="dialog" tabindex="-1">
        <button id="first">Close</button>
        <a id="last" href="/next">Next</a>
      </div>`
    const container = document.querySelector<HTMLElement>("#dialog")
    if (container == null) throw new Error("Missing dialog")
    return container
  }

  function pressTab(container: HTMLElement, shiftKey: boolean) {
    const event = new KeyboardEvent("keydown", { key: "Tab", shiftKey, cancelable: true })
    trapFocus(event, container)
    return event
  }

  it.each([
    [true, "last"],
    [false, "first"],
  ])("wraps from the focused container itself (Shift: %s) to #%s", (shiftKey, expected) => {
    const container = setup()
    container.focus()

    const event = pressTab(container, shiftKey)

    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement?.id).toBe(expected)
  })

  it("brings focus back into the container from the page behind", () => {
    const container = setup()
    document.querySelector<HTMLElement>("#page")?.focus()

    pressTab(container, true)

    expect(document.activeElement?.id).toBe("last")
  })

  it("leaves Tab between elements inside the container to the browser", () => {
    const container = setup()
    document.querySelector<HTMLElement>("#first")?.focus()

    expect(pressTab(container, false).defaultPrevented).toBe(false)
  })
})
