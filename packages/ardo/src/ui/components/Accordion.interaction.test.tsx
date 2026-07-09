// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { ArdoAccordion, ArdoAccordionGroup } from "./Accordion"

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
})
