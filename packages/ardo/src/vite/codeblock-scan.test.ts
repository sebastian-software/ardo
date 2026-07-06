import { describe, expect, it } from "vitest"

import { outdent, scanArdoCodeBlocks } from "./codeblock-scan"

describe("codeblock-scan", () => {
  it("scans self-closing blocks with nested braces and quoted angle brackets", () => {
    const blocks = scanArdoCodeBlocks(`
      <ArdoCodeBlock
        language="tsx"
        meta={{ title: \`a > b\`, nested: { ok: true } }}
      />
    `)

    expect(blocks).toHaveLength(1)
    expect(blocks[0]?.children).toBeNull()
    expect(blocks[0]?.props).toContain('language="tsx"')
    expect(blocks[0]?.props).toContain("nested: { ok: true }")
  })

  it("preserves children for paired code block tags", () => {
    const blocks = scanArdoCodeBlocks(`
      <ArdoCodeBlock language="ts">
        const pattern = /\\{value\\}/gu
        const label = "keep > inside child text"
      </ArdoCodeBlock>
    `)

    expect(blocks).toHaveLength(1)
    expect(blocks[0]?.children).toContain("const pattern")
    expect(outdent(blocks[0]?.children ?? "")).toBe(
      'const pattern = /\\{value\\}/gu\nconst label = "keep > inside child text"'
    )
  })
})
