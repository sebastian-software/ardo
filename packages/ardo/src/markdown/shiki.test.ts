import { describe, expect, it } from "vitest"

import { createShikiHighlighter, highlightCode } from "./shiki"

describe("createShikiHighlighter", () => {
  it("uses default themes when config is omitted", async () => {
    const highlighter = await createShikiHighlighter()

    expect(highlighter.getLoadedThemes()).toStrictEqual(
      expect.arrayContaining(["github-light-default", "github-dark-default"])
    )
  })
})

describe("highlightCode", () => {
  it("loads bundled languages on demand", async () => {
    const html = await highlightCode("const value = 1", "ts", { sourcePath: "example.md" })

    expect(html).toContain("shiki")
    expect(html).toContain("value")
  })
})
