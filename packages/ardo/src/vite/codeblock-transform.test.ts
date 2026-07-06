/* eslint-disable import/first -- vi.mock must be hoisted before importing the transform. */
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  highlightCode: vi.fn(),
  warnHighlightFailure: vi.fn(),
}))

vi.mock("../markdown/shiki", () => ({
  highlightCode: mocks.highlightCode,
}))

vi.mock("../markdown/shiki-warnings", () => ({
  warnHighlightFailure: mocks.warnHighlightFailure,
}))

import { transformArdoCodeBlocks } from "./codeblock-transform"

describe("transformArdoCodeBlocks", () => {
  beforeEach(() => {
    mocks.highlightCode.mockReset()
    mocks.warnHighlightFailure.mockReset()
    mocks.highlightCode.mockResolvedValue("<pre>$&</pre>")
  })

  it("does not expand replacement-pattern tokens when injecting highlighted props", async () => {
    const source = '<ArdoCodeBlock code="console.log(1)" language="tsx" />'

    const result = await transformArdoCodeBlocks(source)

    expect(result).toContain('__html={"<pre>$&</pre>"}')
    expect(result).not.toContain('{"<pre>code=')
  })

  it("decodes escaped newlines without corrupting literal backslash-n content", async () => {
    await transformArdoCodeBlocks(String.raw`<ArdoCodeBlock code="\n" language="tsx" />`)
    expect(mocks.highlightCode).toHaveBeenLastCalledWith("\n", "tsx", expect.any(Object))

    await transformArdoCodeBlocks(String.raw`<ArdoCodeBlock code="\\n" language="tsx" />`)
    expect(mocks.highlightCode).toHaveBeenLastCalledWith("\\n", "tsx", expect.any(Object))
  })

  it("warns once and leaves the source unchanged when highlighting fails", async () => {
    const error = new Error("Unsupported language")
    mocks.highlightCode.mockRejectedValue(error)
    const source = '<ArdoCodeBlock code="class Demo {}" language="java" />'

    const result = await transformArdoCodeBlocks(source, undefined, {
      sourcePath: "/docs/demo.tsx",
    })

    expect(result).toBe(source)
    expect(mocks.warnHighlightFailure).toHaveBeenCalledWith({
      error,
      language: "java",
      sourcePath: "/docs/demo.tsx",
    })
  })
})
