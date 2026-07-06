import { describe, expect, it } from "vitest"

import { assertSupportedNodeVersion, isSupportedNodeVersion } from "./node-version"

describe("Node version support", () => {
  it("accepts the documented Node floor and newer versions", () => {
    expect(isSupportedNodeVersion("22.22.1")).toBe(true)
    expect(isSupportedNodeVersion("24.0.0")).toBe(true)
  })

  it("rejects older Node versions with an actionable message", () => {
    expect(isSupportedNodeVersion("22.22.0")).toBe(false)
    expect(() => {
      assertSupportedNodeVersion("22.22.0")
    }).toThrow("create-ardo requires Node.js 22.22.1 or higher")
  })
})
