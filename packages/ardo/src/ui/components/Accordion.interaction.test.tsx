// @vitest-environment jsdom
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { StrictMode } from "react"
import { afterEach, describe, expect, it } from "vitest"

import type { ReactNode } from "react"

import { ArdoAccordion, ArdoAccordionGroup } from "./Accordion"

function panelFor(trigger: HTMLElement): HTMLElement {
  const panel = document.getElementById(String(trigger.getAttribute("aria-controls")))
  if (panel == null) throw new Error("Accordion trigger controls no panel")
  return panel
}

function Wrapped({ children }: { children: ReactNode }) {
  return <div>{children}</div>
}

function expanded(): Array<string | null> {
  return screen.getAllByRole("button").map((trigger) => trigger.getAttribute("aria-expanded"))
}

function InternalAccordion() {
  return (
    <ArdoAccordion title="Internal" defaultOpen>
      Internal panel
    </ArdoAccordion>
  )
}

describe("ArdoAccordion interactions", () => {
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, "getAnimations")
  })

  it("opens and closes on trigger click", async () => {
    const user = userEvent.setup()
    render(<ArdoAccordion title="Details">Accordion content</ArdoAccordion>)

    const trigger = screen.getByRole("button", { name: "Details" })
    expect(trigger.getAttribute("aria-expanded")).toBe("false")

    await user.click(trigger)
    expect(trigger.getAttribute("aria-expanded")).toBe("true")

    await user.click(trigger)
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
  })

  it("closes the open item when another opens in only-one-open mode", async () => {
    const user = userEvent.setup()
    render(
      <ArdoAccordionGroup onlyOneOpen>
        <ArdoAccordion title="First" defaultOpen>
          First panel
        </ArdoAccordion>
        <ArdoAccordion title="Second">Second panel</ArdoAccordion>
      </ArdoAccordionGroup>
    )

    const first = screen.getByRole("button", { name: "First" })
    const second = screen.getByRole("button", { name: "Second" })
    expect(first.getAttribute("aria-expanded")).toBe("true")

    await user.click(second)
    expect(second.getAttribute("aria-expanded")).toBe("true")
    expect(first.getAttribute("aria-expanded")).toBe("false")
  })

  it("keeps multiple items open outside only-one-open mode", async () => {
    const user = userEvent.setup()
    render(
      <ArdoAccordionGroup>
        <ArdoAccordion title="First">First panel</ArdoAccordion>
        <ArdoAccordion title="Second">Second panel</ArdoAccordion>
      </ArdoAccordionGroup>
    )

    const first = screen.getByRole("button", { name: "First" })
    const second = screen.getByRole("button", { name: "Second" })

    await user.click(first)
    await user.click(second)
    expect(first.getAttribute("aria-expanded")).toBe("true")
    expect(second.getAttribute("aria-expanded")).toBe("true")
  })

  it("moves focus between group triggers with arrow, Home, and End keys", async () => {
    const user = userEvent.setup()
    render(
      <ArdoAccordionGroup>
        <ArdoAccordion title="First">First panel</ArdoAccordion>
        <ArdoAccordion title="Second">
          <ArdoAccordionGroup>
            <ArdoAccordion title="Nested">Nested panel</ArdoAccordion>
          </ArdoAccordionGroup>
        </ArdoAccordion>
        <ArdoAccordion title="Third">Third panel</ArdoAccordion>
      </ArdoAccordionGroup>
    )

    const first = screen.getByRole("button", { name: "First" })
    const second = screen.getByRole("button", { name: "Second" })
    const third = screen.getByRole("button", { name: "Third" })

    first.focus()
    await user.keyboard("{ArrowDown}")
    expect(document.activeElement).toBe(second)
    await user.keyboard("{ArrowDown}")
    expect(document.activeElement).toBe(third)
    await user.keyboard("{ArrowDown}")
    expect(document.activeElement).toBe(first)
    await user.keyboard("{ArrowUp}")
    expect(document.activeElement).toBe(third)
    await user.keyboard("{Home}")
    expect(document.activeElement).toBe(first)
    await user.keyboard("{End}")
    expect(document.activeElement).toBe(third)
  })

  it("toggles with Enter and Space and wires the panel to its trigger", async () => {
    const user = userEvent.setup()
    render(<ArdoAccordion title="Details">Accordion content</ArdoAccordion>)

    const trigger = screen.getByRole("button", { name: "Details" })
    const panel = panelFor(trigger)
    expect(panel.getAttribute("role")).toBe("region")
    expect(panel.getAttribute("aria-labelledby")).toBe(trigger.id)
    expect(panel.getAttribute("hidden")).toBe("until-found")

    trigger.focus()
    await user.keyboard("{Enter}")
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    expect(panel.hasAttribute("hidden")).toBe(false)

    await user.keyboard(" ")
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    await waitFor(() => expect(panel.getAttribute("hidden")).toBe("until-found"))
  })

  it("opens a collapsed panel when find-in-page reveals it", async () => {
    render(
      <ArdoAccordionGroup onlyOneOpen>
        <ArdoAccordion title="First" defaultOpen>
          First panel
        </ArdoAccordion>
        <ArdoAccordion title="Second">Second panel</ArdoAccordion>
      </ArdoAccordionGroup>
    )

    const first = screen.getByRole("button", { name: "First" })
    const second = screen.getByRole("button", { name: "Second" })
    const panel = panelFor(second)

    act(() => {
      panel.dispatchEvent(new Event("beforematch"))
    })
    expect(second.getAttribute("aria-expanded")).toBe("true")
    expect(panel.hasAttribute("hidden")).toBe(false)
    expect(first.getAttribute("aria-expanded")).toBe("false")
  })

  it("keeps a nested accordion independent of the group around it", async () => {
    const user = userEvent.setup()
    render(
      <ArdoAccordionGroup onlyOneOpen>
        <ArdoAccordion title="Outer" defaultOpen>
          <ArdoAccordion title="Inner" defaultOpen>
            Inner panel
          </ArdoAccordion>
          <ArdoAccordion title="Inner closed">Inner closed panel</ArdoAccordion>
        </ArdoAccordion>
        <ArdoAccordion title="Sibling">Sibling panel</ArdoAccordion>
      </ArdoAccordionGroup>
    )

    const outer = screen.getByRole("button", { name: "Outer" })
    const inner = screen.getByRole("button", { name: "Inner" })
    const innerClosed = screen.getByRole("button", { name: "Inner closed" })
    expect(outer.getAttribute("aria-expanded")).toBe("true")
    expect(inner.getAttribute("aria-expanded")).toBe("true")

    await user.click(innerClosed)
    expect(innerClosed.getAttribute("aria-expanded")).toBe("true")
    expect(inner.getAttribute("aria-expanded")).toBe("true")
    expect(outer.getAttribute("aria-expanded")).toBe("true")
  })

  it("honours defaultOpen of a wrapped item and keeps it in the group", async () => {
    const user = userEvent.setup()
    render(
      <ArdoAccordionGroup onlyOneOpen>
        <ArdoAccordion title="First">First panel</ArdoAccordion>
        <Wrapped>
          <ArdoAccordion title="Wrapped" defaultOpen>
            Wrapped panel
          </ArdoAccordion>
        </Wrapped>
        <ArdoAccordion title="Third">Third panel</ArdoAccordion>
      </ArdoAccordionGroup>
    )

    const first = screen.getByRole("button", { name: "First" })
    const wrapped = screen.getByRole("button", { name: "Wrapped" })
    const third = screen.getByRole("button", { name: "Third" })
    expect(wrapped.getAttribute("aria-expanded")).toBe("true")

    await user.click(first)
    expect(first.getAttribute("aria-expanded")).toBe("true")
    expect(wrapped.getAttribute("aria-expanded")).toBe("false")

    first.focus()
    await user.keyboard("{ArrowDown}")
    expect(document.activeElement).toBe(wrapped)
    await user.keyboard("{ArrowDown}")
    expect(document.activeElement).toBe(third)
  })

  it("keeps a wrapped default-open item open when a sibling opens outside only-one-open mode", async () => {
    const user = userEvent.setup()
    render(
      <ArdoAccordionGroup>
        <ArdoAccordion title="First">First panel</ArdoAccordion>
        <Wrapped>
          <ArdoAccordion title="Wrapped" defaultOpen>
            Wrapped panel
          </ArdoAccordion>
        </Wrapped>
      </ArdoAccordionGroup>
    )

    const first = screen.getByRole("button", { name: "First" })
    const wrapped = screen.getByRole("button", { name: "Wrapped" })

    await user.click(first)
    expect(first.getAttribute("aria-expanded")).toBe("true")
    expect(wrapped.getAttribute("aria-expanded")).toBe("true")

    await user.click(wrapped)
    expect(wrapped.getAttribute("aria-expanded")).toBe("false")
  })

  it("opens only the first default-open item of an only-one-open group, wrapped or not", async () => {
    const user = userEvent.setup()
    render(
      <ArdoAccordionGroup onlyOneOpen>
        <Wrapped>
          <ArdoAccordion title="Wrapped first" defaultOpen>
            Wrapped first panel
          </ArdoAccordion>
        </Wrapped>
        <ArdoAccordion title="Direct" defaultOpen>
          Direct panel
        </ArdoAccordion>
        <Wrapped>
          <ArdoAccordion title="Wrapped last" defaultOpen>
            Wrapped last panel
          </ArdoAccordion>
        </Wrapped>
        <InternalAccordion />
      </ArdoAccordionGroup>
    )

    expect(expanded()).toStrictEqual(["true", "false", "false", "false"])

    await user.click(screen.getByRole("button", { name: "Wrapped first" }))
    expect(expanded()).toStrictEqual(["false", "false", "false", "false"])
  })

  it("honours defaultOpen of an item a custom component renders outside only-one-open mode", async () => {
    const user = userEvent.setup()
    render(
      <ArdoAccordionGroup>
        <ArdoAccordion title="First" defaultOpen>
          First panel
        </ArdoAccordion>
        <InternalAccordion />
        <ArdoAccordion title="Third">Third panel</ArdoAccordion>
      </ArdoAccordionGroup>
    )

    expect(expanded()).toStrictEqual(["true", "true", "false"])

    await user.click(screen.getByRole("button", { name: "First" }))
    expect(expanded()).toStrictEqual(["false", "true", "false"])
  })

  it("skips the triggers of a nested accordion during arrow-key navigation", async () => {
    const user = userEvent.setup()
    render(
      <ArdoAccordionGroup>
        <ArdoAccordion title="First">First panel</ArdoAccordion>
        <ArdoAccordion title="Second" defaultOpen>
          <ArdoAccordion title="Nested">Nested panel</ArdoAccordion>
        </ArdoAccordion>
        <ArdoAccordion title="Third">Third panel</ArdoAccordion>
      </ArdoAccordionGroup>
    )

    const second = screen.getByRole("button", { name: "Second" })
    const third = screen.getByRole("button", { name: "Third" })
    const nested = screen.getByRole("button", { name: "Nested" })

    second.focus()
    await user.keyboard("{ArrowDown}")
    expect(document.activeElement).toBe(third)

    nested.focus()
    await user.keyboard("{ArrowDown}")
    expect(document.activeElement).toBe(nested)
  })

  it("does not play the open transition for a default-open item in StrictMode", () => {
    // A transition that never settles keeps the height the open transition pins.
    Object.defineProperty(HTMLElement.prototype, "getAnimations", {
      configurable: true,
      value: () => [
        {
          finished: new Promise(() => {
            /* Never settles. */
          }),
        },
      ],
    })
    render(
      <StrictMode>
        <ArdoAccordion title="Details" defaultOpen>
          Accordion content
        </ArdoAccordion>
      </StrictMode>
    )

    const panel = panelFor(screen.getByRole("button", { name: "Details" }))
    expect(panel.style.getPropertyValue("--accordion-panel-height")).toBe("")
    expect(panel.dataset.startingStyle).toBeUndefined()
  })
})
