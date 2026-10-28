import { describe, expect, it } from "vitest"

import { getLocaleFromPath, getLocalizedPath, getVersionHref } from "./version-path"

describe("getLocalizedPath", () => {
  it("replaces the visible locale while preserving the equivalent nested route", () => {
    expect(getLocalizedPath("/v3/en/guide/getting-started", "en", "de")).toBe(
      "/v3/de/guide/getting-started"
    )
  })

  it("keeps paths that do not contain the active locale unchanged", () => {
    expect(getLocalizedPath("/guide/getting-started", "en", "de")).toBe("/guide/getting-started")
  })

  it("chooses the first locale segment when a nested route uses a locale id", () => {
    expect(getLocaleFromPath("/v3/de/guide/en/example", ["en", "de"])).toBe("de")
  })
})

it("removes locale prefixes for older unlocalized versions and selects a supported target locale", () => {
  expect(getVersionHref("/de/guide/setup", "/v5/", { locale: "de", locales: [] })).toBe(
    "/v5/guide/setup"
  )
  expect(getVersionHref("/de/guide/setup", "/v6/", { locale: "de", locales: ["en", "fr"] })).toBe(
    "/v6/en/guide/setup"
  )
  expect(getVersionHref("/guide/setup", "/v6/", { locales: ["en"] })).toBe("/v6/en/guide/setup")
  expect(getVersionHref("/de", "/v5/", { locale: "de", locales: [] })).toBe("/v5/")
})
