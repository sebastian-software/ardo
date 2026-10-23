import { describe, expect, it } from "vitest"

import { createThemeCss } from "./theme-css"

describe("createThemeCss", () => {
  it("returns nothing for an empty theme", () => {
    expect(createThemeCss({})).toBeUndefined()
  })

  it("sets brand, accent, and neutral hues from presets and numbers", () => {
    expect(createThemeCss({ color: "blue", accent: "teal", neutral: 95 })).toBe(
      ":root{--ardo-hue-brand:240;--ardo-hue-accent:170;--ardo-hue-neutral:95;}"
    )
  })

  it("derives the accent and neutral from the brand hue", () => {
    expect(createThemeCss({ color: 240 })).toBe(
      ":root{--ardo-hue-brand:240;--ardo-hue-accent:114;--ardo-hue-neutral:240;}"
    )
    expect(createThemeCss({ color: -10, accent: 370, neutral: 720 })).toBe(
      ":root{--ardo-hue-brand:350;--ardo-hue-accent:10;--ardo-hue-neutral:0;}"
    )
  })

  it("makes gray achromatic and slate muted", () => {
    expect(createThemeCss({ color: "gray" })).toBe(
      ":root{--ardo-hue-brand:260;--ardo-hue-accent:134;--ardo-hue-neutral:260;--ardo-chroma-brand:0;--ardo-chroma-accent:0;--ardo-chroma-neutral:0;}"
    )
    expect(createThemeCss({ color: "indigo", neutral: "slate" })).toBe(
      ":root{--ardo-hue-brand:270;--ardo-hue-accent:144;--ardo-hue-neutral:255;}"
    )
    expect(createThemeCss({ color: "slate" })).toContain("--ardo-chroma-brand:0.3;")
  })

  it("lets explicit chroma win over a preset", () => {
    expect(createThemeCss({ color: "gray", chroma: { color: 0.5, neutral: 1 } })).toContain(
      "--ardo-chroma-brand:0.5;--ardo-chroma-accent:0;--ardo-chroma-neutral:1;"
    )
    expect(createThemeCss({ chroma: 0.4 })).toBe(
      ":root{--ardo-chroma-brand:0.4;--ardo-chroma-accent:0.4;}"
    )
  })

  it("sets callout hues, fonts, and shared tokens", () => {
    expect(
      createThemeCss({
        status: { warning: 85, tip: "teal" },
        fonts: { body: '"Inter Variable", system-ui', mono: "JetBrains Mono" },
        tokens: { radius: { base: "0.25rem" } },
      })
    ).toBe(
      ':root{--ardo-hue-warning:85;--ardo-hue-tip:170;--ardo-font-family:"Inter Variable", system-ui;--ardo-font-mono:JetBrains Mono;--ardo-radius-base:0.25rem;}'
    )
  })

  it("scopes light and dark tokens to their color scheme", () => {
    expect(
      createThemeCss({
        light: { color: { codeBg: "oklch(0.973 0.006 95)" } },
        dark: { color: { codeBg: "oklch(0.205 0.01 95)" } },
      })
    ).toBe(
      ":root:not(.dark){--ardo-color-codeBg:oklch(0.973 0.006 95);}:root.dark{--ardo-color-codeBg:oklch(0.205 0.01 95);}"
    )
  })

  it("names the mistake in an invalid theme", () => {
    // @ts-expect-error exercising runtime validation
    expect(() => createThemeCss({ color: "cerulean" })).toThrow("theme.color must be one of")
    expect(() => createThemeCss({ chroma: { accent: -1 } })).toThrow("theme.chroma.accent")
    // @ts-expect-error exercising runtime validation
    expect(() => createThemeCss({ light: { color: { codeBG: "red" } } })).toThrow(
      "theme.light.color.codeBG is not an Ardo token"
    )
    // @ts-expect-error exercising runtime validation
    expect(() => createThemeCss({ status: { brand: 10 } })).toThrow("theme.status.brand")
    expect(() => createThemeCss({ fonts: { body: "x;}body{display:none" } })).toThrow(
      "theme.fonts.body must be a CSS value"
    )
    expect(() => createThemeCss({ tokens: { color: { bg: "red</style>" } } })).toThrow(
      "theme.tokens.color.bg must be a CSS value"
    )
  })
})
