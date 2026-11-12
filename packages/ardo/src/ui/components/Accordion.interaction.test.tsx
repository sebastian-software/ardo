// @vitest-environment jsdom
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { ArdoAccordion, ArdoAccordionGroup } from "./Accordion"

function panelFor(trigger: HTMLElement): HTMLElement {
  const panel = document.getElementById(String(trigger.getAttribute("aria-controls")))
  if (panel == null) throw new Error("Accordion trigger controls no panel")
  return panel
}

describe("ArdoAccordion interactions", () => {
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
})
