import { describe, expect, it } from "vitest"

import { transformMarkdown } from "./pipeline"
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

describe("transformMarkdown", () => {
  it("renders Ferriki HAST without raw nodes and preserves fence metadata", async () => {
    const result = await transformMarkdown(
      '```ts title="example.ts" [TypeScript] {2}\nconst first = 1\nconst second = 2\n```',
      {
        lineNumbers: true,
        theme: {
          dark: "github-dark-default",
          light: "github-light-default",
        },
      }
    )

    expect(result.html).toContain('class="ardo-shiki"')
    expect(result.html).toContain("<div data-title>example.ts</div>")
    expect(result.html).toContain('data-lang="ts"')
    expect(result.html).toContain('data-label="TypeScript"')
    expect(result.html).toContain('data-ln="1"')
    expect(result.html).toContain('data-ln="2"')
    expect(result.html).toContain('class="line highlighted"')
    expect(result.html).toContain("--shiki-light")
    expect(result.html).toContain("--shiki-dark")
    expect(result.html).not.toContain("<raw")
  })
})
