import { describe, expect, it } from "vitest"

import { parseCliArgs } from "./cli-options"

describe("parseCliArgs", () => {
  it("parses positional target/template and non-interactive flags", () => {
    expect(
      parseCliArgs([
        "my-docs",
        "minimal",
        "--yes",
        "--title",
        "Docs",
        "--typedoc",
        "--no-github-pages",
      ])
    ).toStrictEqual({
      githubPages: false,
      help: false,
      siteTitle: "Docs",
      targetDir: "my-docs",
      template: "minimal",
      typedoc: true,
      yes: true,
    })
  })

  it("rejects unknown flags", () => {
    expect(() => parseCliArgs(["--wat"])).toThrow("Unknown option: --wat")
  })
})
