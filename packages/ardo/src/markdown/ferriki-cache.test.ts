import { afterEach, describe, expect, it, vi } from "vitest"

describe("Ferriki highlighter cache", () => {
  afterEach(() => {
    vi.doUnmock("@ferriki/core")
    vi.resetModules()
  })

  it("retries highlighter initialization after a transient failure", async () => {
    vi.resetModules()

    const highlighter = {
      codeToHtml: vi.fn().mockReturnValue("<pre>recovered</pre>"),
      loadLanguage: vi.fn().mockResolvedValue(undefined),
      resolveLangAlias: vi.fn().mockReturnValue("ts"),
    }
    const createHighlighter = vi
      .fn()
      .mockRejectedValueOnce(new Error("temporary asset failure"))
      .mockResolvedValueOnce(highlighter)
    vi.doMock("@ferriki/core", () => ({ createHighlighter }))

    const { highlightCode } = await import("./ferriki")
    await expect(highlightCode("const answer = 42", "ts")).rejects.toThrow(
      "temporary asset failure"
    )
    await expect(highlightCode("const answer = 42", "ts")).resolves.toBe("<pre>recovered</pre>")
    expect(createHighlighter).toHaveBeenCalledTimes(2)
  })
})
