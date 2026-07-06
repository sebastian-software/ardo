import { describe, expect, it } from "vitest"

import {
  ARDO_THEME_STORAGE_KEY,
  getArdoThemeBootstrapScript,
  resolveThemeBootstrapState,
} from "./theme-mode"

describe("resolveThemeBootstrapState", () => {
  it("keeps stored user preference in auto mode", () => {
    expect(
      resolveThemeBootstrapState({
        prefersDark: false,
        storedTheme: "dark",
      })
    ).toStrictEqual({
      clearsStorage: false,
      isDark: true,
      theme: "dark",
    })
  })

  it("can force light mode and clear stale storage", () => {
    expect(
      resolveThemeBootstrapState({
        preference: "light",
        prefersDark: true,
        storedTheme: "dark",
      })
    ).toStrictEqual({
      clearsStorage: true,
      isDark: false,
      theme: "light",
    })
  })

  it("can always follow system preference without stored overrides", () => {
    expect(
      resolveThemeBootstrapState({
        preference: "system",
        prefersDark: true,
        storedTheme: "light",
      })
    ).toStrictEqual({
      clearsStorage: true,
      isDark: true,
      theme: "system",
    })
  })
})

describe("getArdoThemeBootstrapScript", () => {
  it("embeds the configured preference and storage key", () => {
    const script = getArdoThemeBootstrapScript("light")

    expect(script).toContain('const configuredTheme = "light"')
    expect(script).toContain(ARDO_THEME_STORAGE_KEY)
    expect(script).toContain("localStorage.removeItem")
  })
})
