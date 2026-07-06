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

  it("applies shared token overrides to both themes", () => {
    const theme = createTheme({
      color: {
        bg: "#fbfbf8",
        brand: "#0038ff",
        brandGradient: "#0038ff",
        shadowSm: "0 0 0 0 transparent",
      },
      radius: {
        base: "0px",
        lg: "0px",
        sm: "0px",
      },
    })

    expect(theme.light.color.bg).toBe("#fbfbf8")
    expect(theme.dark.color.bg).toBe("#fbfbf8")
    expect(theme.light.color.brand).toBe("#0038ff")
    expect(theme.light.color.brandGradient).toBe("#0038ff")
    expect(theme.light.color.shadowSm).toBe("0 0 0 0 transparent")
    expect(theme.dark.radius).toStrictEqual({ base: "0px", lg: "0px", sm: "0px" })
  })

  it("supports light and dark specific token overrides", () => {
    const theme = createTheme({
      dark: {
        color: {
          bg: "#101010",
          text: "#fbfbf8",
        },
      },
      light: {
        color: {
          bg: "#fbfbf8",
          text: "#101010",
        },
      },
      primary: 220,
    })

    expect(theme.light.hue.brand).toBe("220")
    expect(theme.light.color.bg).toBe("#fbfbf8")
    expect(theme.light.color.text).toBe("#101010")
    expect(theme.dark.color.bg).toBe("#101010")
    expect(theme.dark.color.text).toBe("#fbfbf8")
  })
})
