import { describe, expect, it } from "vitest"

import { createBrandThemeCss, resolveBrandThemeHues } from "./brand"

describe("resolveBrandThemeHues", () => {
  it("resolves preset brand, accent, and neutral hues", () => {
    expect(
      resolveBrandThemeHues({ color: "blue", accent: "teal", neutral: "slate" })
    ).toStrictEqual({
      color: 240,
      accent: 170,
      neutral: 260,
    })
  })

  it("derives accent and neutral hues from color", () => {
    expect(resolveBrandThemeHues({ color: 240 })).toStrictEqual({
      color: 240,
      accent: 114,
      neutral: 240,
    })
  })

  it("normalizes numeric hues", () => {
    expect(resolveBrandThemeHues({ color: -10, accent: 370, neutral: 720 })).toStrictEqual({
      color: 350,
      accent: 10,
      neutral: 0,
    })
  })
})

describe("createBrandThemeCss", () => {
  it("emits hue variable overrides for configured brand values", () => {
    expect(createBrandThemeCss({ color: "blue", accent: "teal", neutral: "slate" })).toBe(
      ":root{--ardo-hue-brand:240;--ardo-hue-accent:170;--ardo-hue-neutral:260;}"
    )
  })

  it("returns undefined when no brand hues are configured", () => {
    expect(createBrandThemeCss({ logo: "./app/assets/logo.svg" })).toBeUndefined()
  })
})
