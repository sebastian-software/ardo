// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { ArdoCompareSlider } from "./CompareSlider"

function renderSlider(initial?: number) {
  const view = render(
    <ArdoCompareSlider
      label="Sign-in page"
      first={<span>Before view</span>}
      firstLabel="Before"
      second={<span>After view</span>}
      secondLabel="After"
      initial={initial}
    />
  )
  const slider = screen.getByRole("slider", {
    name: "Sign-in page: Before left of the divider, After right of it",
  })
  const stage = view.container.querySelector<HTMLElement>('[data-rcs="root"]')!
  const position = () => stage.style.getPropertyValue("--rcs-raw-position")
  return { slider, position }
}

// jsdom has no layout, so pointer and touch moves are covered by the component gallery's
// browser test. Keyboard moves need no layout.
describe("ArdoCompareSlider interactions", () => {
  it("moves the divider with the arrow keys and announces the new split", async () => {
    const user = userEvent.setup()
    const { slider, position } = renderSlider(40)

    slider.focus()
    await user.keyboard("{ArrowRight}{ArrowRight}")

    expect(slider.getAttribute("aria-valuenow")).toBe("44")
    expect(slider.getAttribute("aria-valuetext")).toBe("Before 44%, After 56%")
    expect(position()).toBe("44%")

    await user.keyboard("{ArrowLeft}")
    expect(slider.getAttribute("aria-valuenow")).toBe("42")
    expect(position()).toBe("42%")
  })

  it("jumps to the edges with Home and End and by twenty percent with Page Up and Page Down", async () => {
    const user = userEvent.setup()
    const { slider, position } = renderSlider()

    slider.focus()
    await user.keyboard("{Home}")
    expect(slider.getAttribute("aria-valuenow")).toBe("0")
    expect(slider.getAttribute("aria-valuetext")).toBe("Before 0%, After 100%")
    expect(position()).toBe("0%")

    await user.keyboard("{PageUp}")
    expect(slider.getAttribute("aria-valuenow")).toBe("20")

    await user.keyboard("{End}")
    expect(slider.getAttribute("aria-valuenow")).toBe("100")
    expect(position()).toBe("100%")

    await user.keyboard("{PageDown}")
    expect(slider.getAttribute("aria-valuenow")).toBe("80")
  })
})
