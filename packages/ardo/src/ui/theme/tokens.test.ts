import { describe, expect, it } from "vitest"

import { createTheme } from "./tokens"

describe("createTheme", () => {
  it("keeps the number API compatible while exposing CSS hue tokens", () => {
    const theme = createTheme(130)

    expect(theme.light.hue).toStrictEqual({
      brand: "130",
      accent: "4",
      neutral: "130",
    })
    expect(theme.dark.hue).toStrictEqual(theme.light.hue)
    expect(theme.light.color.brand).toBe("oklch(0.5 0.1 var(--ardo-hue-brand))")
    expect(theme.light.color.bg).toBe("oklch(0.992 0.0015 var(--ardo-hue-neutral))")
    expect(theme.dark.color.sidebarBg).toBe("oklch(0.13 0.008 var(--ardo-hue-neutral))")
  })

  it("supports a neutral hue independent from brand and accent hues", () => {
    const theme = createTheme({ primary: 130, secondary: 45, neutral: 260 })

    expect(theme.light.hue).toStrictEqual({
      brand: "130",
      accent: "45",
      neutral: "260",
    })
    expect(theme.light.color.accent).toBe("oklch(0.5 0.075 var(--ardo-hue-accent))")
    expect(theme.light.color.border).toBe("oklch(0.88 0.005 var(--ardo-hue-neutral))")
    expect(theme.dark.color.text).toBe("oklch(0.94 0.004 var(--ardo-hue-neutral))")
  })
})
