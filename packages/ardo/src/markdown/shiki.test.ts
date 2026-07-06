import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  bundledLanguages: {
    java: {},
    javascript: {},
    php: {},
  },
  createHighlighter: vi.fn(),
}))

vi.mock("shiki", () => ({
  bundledLanguages: mocks.bundledLanguages,
  createHighlighter: mocks.createHighlighter,
}))

describe("shiki highlighter", () => {
  beforeEach(() => {
    vi.resetModules()
    mocks.createHighlighter.mockReset()
    mocks.createHighlighter.mockImplementation(() => ({
      codeToHtml: vi.fn((_code: string, options: unknown) => JSON.stringify(options)),
    }))
  })

  it("loads Shiki's bundled languages instead of a fixed local subset", async () => {
    const { createShikiHighlighter } = await import("./shiki")

    await createShikiHighlighter({})

    expect(mocks.createHighlighter).toHaveBeenCalledWith(
      expect.objectContaining({
        langs: ["java", "javascript", "php"],
      })
    )
  })

  it("caches highlighters by theme configuration", async () => {
    const { highlightCode } = await import("./shiki")

    await highlightCode("const value = 1", "javascript", { theme: "github-dark-default" })
    await highlightCode("const value = 2", "javascript", { theme: "github-dark-default" })
    await highlightCode("const value = 3", "javascript", { theme: "github-light-default" })

    expect(mocks.createHighlighter).toHaveBeenCalledTimes(2)
  })
})
