import { describe, expect, it } from "vitest"

import { getGitHubPagesBase } from "./git-utils"

describe("getGitHubPagesBase", () => {
  it("uses repo subpaths for project pages", () => {
    expect(getGitHubPagesBase("ardo")).toBe("/ardo/")
  })

  it("uses the root base for user and organization pages", () => {
    expect(getGitHubPagesBase("sebastian-software.github.io")).toBe("/")
  })
})
