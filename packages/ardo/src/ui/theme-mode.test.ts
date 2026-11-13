// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  ARDO_THEME_STORAGE_KEY,
  getArdoThemeBootstrapScript,
  getInitialThemeMode,
  resolveThemeBootstrapState,
  storeThemeMode,
} from "./theme-mode"

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe("blocked storage", () => {
  it("falls back to system when reading storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError")
    })

    expect(getInitialThemeMode()).toBe("system")
  })

  it("ignores storage write failures", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError")
    })
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError")
    })

    expect(() => storeThemeMode("dark")).not.toThrow()
  })

  it("reads and writes the stored theme when storage is available", () => {
    storeThemeMode("dark")

    expect(localStorage.getItem(ARDO_THEME_STORAGE_KEY)).toBe("dark")
    expect(getInitialThemeMode()).toBe("dark")
  })
})

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
