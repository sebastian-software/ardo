// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ArdoCompareSlider } from "./CompareSlider"

// The browser moves the native range input by pointer, touch, and keyboard; jsdom does not, so
// these tests change its value directly. The component gallery's browser test covers the rest.
describe("ArdoCompareSlider interactions", () => {
  it("moves the divider to the input's value", () => {
    const view = render(
      <ArdoCompareSlider
        label="Sign-in page"
        first={<span>Before view</span>}
        firstLabel="Before"
        second={<span>After view</span>}
        secondLabel="After"
        initial={40}
      />
    )
    const slider = screen.getByRole("slider", {
      name: "Sign-in page: Before left of the divider, After right of it",
    })
    const root = view.container.firstElementChild as HTMLElement

    fireEvent.change(slider, { target: { value: "80" } })
    expect(root.style.getPropertyValue("--ardo-compare-slider-position")).toBe("80%")
    expect(slider.getAttribute("aria-valuetext")).toBe("Before 80%, After 20%")

    fireEvent.change(slider, { target: { value: "0" } })
    expect(root.style.getPropertyValue("--ardo-compare-slider-position")).toBe("0%")
    expect(slider.getAttribute("aria-valuetext")).toBe("Before 0%, After 100%")
  })
})
