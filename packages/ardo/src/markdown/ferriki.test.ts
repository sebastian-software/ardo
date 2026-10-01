import { describe, expect, it } from "vitest"

import { highlightCode } from "./ferriki"

describe("Ferriki highlighting", () => {
  it("renders highlighted code with the configured light and dark themes", async () => {
    const html = await highlightCode("const answer = 42", "ts")

    expect(html).toContain('class="shiki')
    expect(html).toContain("--shiki-light")
    expect(html).toContain("--shiki-dark")
    expect(html).toContain("answer")
  })

  it("preserves title, label, highlighted lines, and line numbers from fence metadata", async () => {
    const html = await highlightCode("const first = 1\nconst second = 2", "ts", {
      lineNumbers: true,
      meta: 'title="example.ts" [API] {2}',
    })

    expect(html).toContain('data-title="example.ts"')
    expect(html).toContain('data-label="API"')
    expect(html).toContain('data-ln="1"')
    expect(html).toContain('class="line highlighted"')
  })
})
