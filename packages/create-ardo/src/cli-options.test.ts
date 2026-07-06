import { describe, expect, it } from "vitest"

import { parseCreateArdoArgs } from "./cli-options"

describe("parseCreateArdoArgs", () => {
  it("parses non-interactive flags and positionals", () => {
    const options = parseCreateArdoArgs([
      "docs/site",
      "minimal",
      "--yes",
      "--title",
      "Product Docs",
      "--typedoc",
      "--no-github-pages",
      "--package-manager",
      "npm",
    ])

    expect(options).toMatchObject({
      docType: "library",
      githubPages: false,
      packageManager: "npm",
      siteTitle: "Product Docs",
      targetDir: "docs/site",
      template: "minimal",
      yes: true,
    })
  })

  it("detects the package manager from npm_config_user_agent", () => {
    expect(parseCreateArdoArgs([], { npm_config_user_agent: "bun/1.3.0" }).packageManager).toBe(
      "bun"
    )
    expect(
      parseCreateArdoArgs([], { npm_config_user_agent: "yarn/4.12.0 npm/11" }).packageManager
    ).toBe("yarn")
  })

  it("rejects unknown flags and package managers", () => {
    expect(() => parseCreateArdoArgs(["--wat"])).toThrow('Unknown option "--wat"')
    expect(() => parseCreateArdoArgs(["--package-manager", "deno"])).toThrow(
      'Unsupported package manager "deno"'
    )
  })
})
