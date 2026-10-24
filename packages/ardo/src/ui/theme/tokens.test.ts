import { describe, expect, it } from "vitest"

import { darkTokens, lightTokens } from "./tokens"

describe("default tokens", () => {
  it("keep every hue in a CSS variable with Ardo's defaults", () => {
    expect(lightTokens.hue).toStrictEqual({
      brand: "356",
      accent: "230",
      neutral: "356",
      tip: "155",
      warning: "45",
      danger: "25",
      info: "220",
      note: "270",
    })
    expect(darkTokens.hue).toStrictEqual(lightTokens.hue)
    expect(lightTokens.chroma).toStrictEqual({ brand: "1", accent: "1", neutral: "1" })
  })

  it("derive brand, chrome, and callout colors from those variables", () => {
    expect(lightTokens.color.brand).toBe(
      "oklch(0.48 calc(0.185 * var(--ardo-chroma-brand)) var(--ardo-hue-brand))"
    )
    expect(lightTokens.color.bg).toBe(
      "oklch(0.992 calc(0.0015 * var(--ardo-chroma-neutral)) var(--ardo-hue-neutral))"
    )
    expect(lightTokens.color.warningBg).toBe("oklch(0.98 0.03 var(--ardo-hue-warning))")
    expect(darkTokens.color.warning).toBe("oklch(0.8 0.12 calc(var(--ardo-hue-warning) + 15))")
  })

  it("let headings follow the body font", () => {
    expect(lightTokens.font.familyHeading).toBe("var(--ardo-font-family)")
  })
})
