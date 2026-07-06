import { beforeEach, describe, expect, it, vi } from "vitest"

import { highlightCode } from "../markdown/shiki"
import { transformArdoCodeBlocks } from "./codeblock-transform"

vi.mock("../markdown/shiki", () => ({
  highlightCode: vi.fn(async (code: string, language: string) => {
    await Promise.resolve()
    return `<pre>${language}:${code}</pre>`
  }),
}))

const mockedHighlightCode = vi.mocked(highlightCode)

describe("transformArdoCodeBlocks", () => {
  beforeEach(() => {
    mockedHighlightCode.mockClear()
  })

  it("does not expand replacement patterns from user code props", async () => {
    const source = '<ArdoCodeBlock code="$&" language="tsx" />'

    const transformed = await transformArdoCodeBlocks(source)

    expect(transformed).toContain('code="$&"')
    expect(transformed).toContain("__html=")
  })

  it("preserves escaped literal backslash-n sequences in code props", async () => {
    const source = '<ArdoCodeBlock code="\\\\n" language="text" />'

    await transformArdoCodeBlocks(source)

    expect(mockedHighlightCode).toHaveBeenCalledWith("\\n", "text", {
      sourcePath: undefined,
      theme: undefined,
    })
  })

  it("passes the source path to highlighting warnings", async () => {
    const source = '<ArdoCodeBlock code="const x = 1" language="ts" />'

    await transformArdoCodeBlocks(source, undefined, { sourcePath: "/site/app/demo.tsx" })

    expect(mockedHighlightCode).toHaveBeenCalledWith("const x = 1", "ts", {
      sourcePath: "/site/app/demo.tsx",
      theme: undefined,
    })
  })
})
