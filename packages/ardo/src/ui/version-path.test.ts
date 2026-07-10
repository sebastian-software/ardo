import { describe, expect, it } from "vitest"

import { getLocalizedPath } from "./version-path"

describe("getLocalizedPath", () => {
  it("replaces the visible locale while preserving the equivalent nested route", () => {
    expect(getLocalizedPath("/v3/en/guide/getting-started", "en", "de")).toBe(
      "/v3/de/guide/getting-started"
    )
  })

  it("keeps paths that do not contain the active locale unchanged", () => {
    expect(getLocalizedPath("/guide/getting-started", "en", "de")).toBe("/guide/getting-started")
  })
})
