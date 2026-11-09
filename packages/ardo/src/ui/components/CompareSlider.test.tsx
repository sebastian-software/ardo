/* eslint-disable import/first -- vi.mock must be hoisted before importing the component. */
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("./CompareSlider.css", () => ({
  root: "root",
  tags: "tags",
  stage: "stage",
  layer: "layer",
  handleRoot: "handle-root",
  handleStyle: { "--rcs-handle-color": "var(--ardo-color-brand)" },
  handleButtonStyle: { backgroundColor: "var(--ardo-color-bg)" },
  handleLinesStyle: { boxShadow: "none" },
}))

import { ArdoSiteConfigProvider } from "../../runtime/hooks"
import { resolveArdoLabels } from "../labels"
import { ArdoCompareSlider } from "./CompareSlider"

const sides = {
  label: "Sign-in page",
  first: <img src="/before.png" alt="Before the redesign" />,
  firstLabel: "Before",
  second: <img src="/after.png" alt="After the redesign" />,
  secondLabel: "After",
}

describe("ArdoCompareSlider", () => {
  it("renders both views in react-compare-slider's items and names the handle", () => {
    const view = renderToStaticMarkup(<ArdoCompareSlider {...sides} />)

    expect(view).toContain('dir="ltr"')
    expect(view).toContain('data-rcs="root"')
    expect(view).toContain("--rcs-raw-position:50%")
    expect(view).toMatch(/data-rcs-item="itemOne"[^>]*><img src="\/before.png"/u)
    expect(view).toMatch(/data-rcs-item="itemTwo"[^>]*><img src="\/after.png"/u)
    expect(view).toContain('role="slider"')
    expect(view).toContain('aria-valuemin="0"')
    expect(view).toContain('aria-valuemax="100"')
    expect(view).toContain('aria-valuenow="50"')
    expect(view).toContain(
      'aria-label="Sign-in page: Before left of the divider, After right of it"'
    )
    expect(view).toContain('aria-valuetext="Before 50%, After 50%"')
    expect(view).not.toContain("Click and drag")
  })

  it("colors the handle with the theme tokens", () => {
    const view = renderToStaticMarkup(<ArdoCompareSlider {...sides} />)

    expect(view).toContain("--rcs-handle-color:var(--ardo-color-brand)")
    expect(view).toContain("background-color:var(--ardo-color-bg)")
  })

  it("shows the side names as decorative tags", () => {
    const view = renderToStaticMarkup(<ArdoCompareSlider {...sides} />)

    expect(view).toContain(
      '<div class="tags" aria-hidden="true"><span>← Before</span><span>After →</span></div>'
    )
  })

  it.each([
    [30, "30"],
    [12.6, "13"],
    [-20, "0"],
    [140, "100"],
    [Number.NaN, "50"],
  ])("starts the divider at %s as %s percent", (initial, expected) => {
    const view = renderToStaticMarkup(<ArdoCompareSlider {...sides} initial={initial} />)

    expect(view).toContain(`--rcs-raw-position:${expected}%`)
    expect(view).toContain(`aria-valuenow="${expected}"`)
    expect(view).toContain(`aria-valuetext="Before ${expected}%, After ${100 - Number(expected)}%"`)
  })

  it("adds a custom class to the root", () => {
    const view = renderToStaticMarkup(<ArdoCompareSlider {...sides} className="wide" />)

    expect(view).toContain('class="root wide"')
  })

  it("speaks the translated labels passed to the site", () => {
    const labels = resolveArdoLabels({
      compareSlider: {
        name: (label, first, second) => `${label}: links ${first}, rechts ${second}`,
        value: ({ first, firstPercent, second, secondPercent }) =>
          `${first} ${firstPercent} %, ${second} ${secondPercent} %`,
      },
    })

    const view = renderToStaticMarkup(
      <ArdoSiteConfigProvider value={{ labels }}>
        <ArdoCompareSlider {...sides} initial={25} />
      </ArdoSiteConfigProvider>
    )

    expect(view).toContain('aria-label="Sign-in page: links Before, rechts After"')
    expect(view).toContain('aria-valuetext="Before 25 %, After 75 %"')
  })
})
