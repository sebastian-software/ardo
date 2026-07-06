import { describe, expect, it } from "vitest"

import { ARDO_THEME_STORAGE_KEY, createThemeBootstrapScript } from "./theme-mode"

describe("createThemeBootstrapScript", () => {
  it("defaults to stored or system theme mode", () => {
    const script = createThemeBootstrapScript()

    expect(script).toContain('const configuredTheme = "system"')
    expect(script).toContain(`localStorage.getItem("${ARDO_THEME_STORAGE_KEY}")`)
    expect(script).toContain("prefers-color-scheme: dark")
  })

  it("forces fixed light and dark modes to ignore stale stored preferences", () => {
    const lightScript = createThemeBootstrapScript("light")
    const darkScript = createThemeBootstrapScript("dark")

    expect(lightScript).toContain('const configuredTheme = "light"')
    expect(lightScript).toContain(`localStorage.removeItem("${ARDO_THEME_STORAGE_KEY}")`)
    expect(darkScript).toContain('const configuredTheme = "dark"')
    expect(darkScript).toContain(`localStorage.removeItem("${ARDO_THEME_STORAGE_KEY}")`)
  })
})
