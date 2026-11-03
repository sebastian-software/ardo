import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { ModelContext } from "./search-webmcp"

import { loadSearchIndex } from "./search-index"
import { registerSearchWebMcp } from "./search-webmcp"

vi.mock("./search-index", () => ({ loadSearchIndex: vi.fn() }))

type RegisterTool = ModelContext["registerTool"]
type RegisteredTool = Parameters<RegisterTool>[0]
type FakeContext = ModelContext & { registerTool: ReturnType<typeof vi.fn<RegisterTool>> }
type SearchResponse = {
  results?: Array<{ title: string; section?: string; url: string; excerpt: string }>
  error?: { code: string; message: string }
}

const options = {
  locale: "en",
  loadIndex: loadSearchIndex,
  resolveHref: (to: string) => `/docs${to}`,
}

function fakeContext(): FakeContext {
  return { registerTool: vi.fn<RegisterTool>() }
}

function toolFrom(context: FakeContext): RegisteredTool {
  const tool = context.registerTool.mock.calls[0]?.[0]
  if (tool === undefined) throw new Error("tool was not registered")
  return tool
}

/** Registers the tool on a fresh context and runs it with the given input. */
async function run(input: unknown, resolveHref = options.resolveHref): Promise<SearchResponse> {
  const context = fakeContext()
  registerSearchWebMcp(context, { ...options, resolveHref }, new AbortController().signal)
  return (await toolFrom(context).execute(input, {
    signal: new AbortController().signal,
  })) as SearchResponse
}

function mockIndex(hits: Array<Record<string, unknown>>) {
  const search = vi.fn(() => hits)
  vi.mocked(loadSearchIndex).mockResolvedValue({ search } as never)
  return search
}

beforeEach(() => {
  vi.stubGlobal("location", { origin: "https://docs.example.com" })
  vi.mocked(loadSearchIndex).mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("registerSearchWebMcp", () => {
  it("registers search_documentation once per context", () => {
    const context = fakeContext()
    const lifetime = new AbortController()

    registerSearchWebMcp(context, options, lifetime.signal)
    registerSearchWebMcp(context, options, lifetime.signal)

    expect(context.registerTool).toHaveBeenCalledTimes(1)
    const tool = toolFrom(context)
    expect(tool).toMatchObject({
      name: "search_documentation",
      annotations: { readOnlyHint: true, untrustedContentHint: true },
    })
    expect(tool.description).toContain("documentation")
    expect(context.registerTool.mock.calls[0]?.[1]).toStrictEqual({ signal: lifetime.signal })
  })

  it("does nothing without registerTool", () => {
    const signal = new AbortController().signal
    expect(() => registerSearchWebMcp(undefined, options, signal)).not.toThrow()
    expect(() => registerSearchWebMcp({} as ModelContext, options, signal)).not.toThrow()
    expect(loadSearchIndex).not.toHaveBeenCalled()
  })

  it("does not register when the signal is already aborted", () => {
    const context = fakeContext()
    const lifetime = new AbortController()
    lifetime.abort()

    registerSearchWebMcp(context, options, lifetime.signal)

    expect(context.registerTool).not.toHaveBeenCalled()
  })

  it("registers again after the previous registration is aborted", () => {
    const context = fakeContext()
    const first = new AbortController()
    registerSearchWebMcp(context, options, first.signal)
    first.abort()

    const second = new AbortController()
    registerSearchWebMcp(context, options, second.signal)

    expect(context.registerTool).toHaveBeenCalledTimes(2)
  })

  it("allows a retry when registerTool rejects", async () => {
    const context = fakeContext()
    context.registerTool.mockRejectedValueOnce(new Error("duplicate"))
    const lifetime = new AbortController()

    registerSearchWebMcp(context, options, lifetime.signal)
    await Promise.resolve()
    await Promise.resolve()

    registerSearchWebMcp(context, options, lifetime.signal)
    expect(context.registerTool).toHaveBeenCalledTimes(2)
  })

  it("does not load the index at registration time", () => {
    registerSearchWebMcp(fakeContext(), options, new AbortController().signal)

    expect(loadSearchIndex).not.toHaveBeenCalled()
  })
})

describe("search_documentation input validation", () => {
  it.each([
    ["a non-object", "routing"],
    ["an array", ["routing"]],
    ["a missing query", {}],
    ["a blank query", { query: "   " }],
    ["a non-string query", { query: 42 }],
    ["a non-integer limit", { query: "routing", limit: 2.5 }],
    ["a string limit", { query: "routing", limit: "3" }],
  ])("returns invalid_input for %s", async (_label, input) => {
    const result = await run(input)

    expect(result.error?.code).toBe("invalid_input")
    expect(loadSearchIndex).not.toHaveBeenCalled()
  })

  it("rejects a query longer than 500 characters", async () => {
    const result = await run({ query: "a".repeat(501) })

    expect(result.error?.code).toBe("invalid_input")
  })
})

describe("search_documentation results", () => {
  it("searches the locale index with the trimmed query and maps hits", async () => {
    const search = mockIndex([
      {
        title: "Parameters",
        pageTitle: "Routing",
        excerpt: "Use dynamic segments.",
        path: "/guide/routing#parameters",
      },
      {
        title: "Routing",
        pageTitle: "Routing",
        excerpt: "Pages map to files.",
        path: "/guide/routing",
      },
    ])

    const result = await run({ query: "  routing  " })

    expect(loadSearchIndex).toHaveBeenCalledWith("en")
    expect(search).toHaveBeenCalledWith("routing")
    expect(result).toStrictEqual({
      results: [
        {
          title: "Routing",
          section: "Parameters",
          url: "https://docs.example.com/docs/guide/routing#parameters",
          excerpt: "Use dynamic segments.",
        },
        {
          title: "Routing",
          url: "https://docs.example.com/docs/guide/routing",
          excerpt: "Pages map to files.",
        },
      ],
    })
  })

  it("uses the same href resolver as site search links", async () => {
    const resolveHref = vi.fn((to: string) => `/base${to}`)
    mockIndex([{ title: "Intro", pageTitle: "Intro", excerpt: "", path: "/intro/" }])

    const result = await run({ query: "intro" }, resolveHref)

    expect(resolveHref).toHaveBeenCalledWith("/intro/")
    expect(result).toStrictEqual({
      results: [{ title: "Intro", url: "https://docs.example.com/base/intro/", excerpt: "" }],
    })
  })

  it.each([
    [{ query: "page" }, 5],
    [{ query: "page", limit: 0 }, 1],
    [{ query: "page", limit: -4 }, 1],
    [{ query: "page", limit: 3 }, 3],
    [{ query: "page", limit: 50 }, 20],
  ])("input %o returns at most %s results", async (input, expected) => {
    mockIndex(
      Array.from({ length: 30 }, (_, i) => ({
        title: `Page ${i}`,
        pageTitle: `Page ${i}`,
        excerpt: "",
        path: `/page-${i}`,
      }))
    )

    const result = await run(input)

    expect(result.results).toHaveLength(expected)
  })

  it("skips hits without a path and caps long excerpts", async () => {
    mockIndex([
      { title: "No path", pageTitle: "No path", excerpt: "x" },
      { title: "Long", pageTitle: "Long", excerpt: "y".repeat(5000), path: "/long" },
    ])

    const result = await run({ query: "long" })

    expect(result.results).toHaveLength(1)
    expect(result.results?.[0]?.excerpt).toHaveLength(1000)
  })

  it("returns index_unavailable when the index fails to load", async () => {
    vi.mocked(loadSearchIndex).mockRejectedValue(new Error("network down"))

    const result = await run({ query: "routing" })

    expect(result.error?.code).toBe("index_unavailable")
    expect(result.results).toBeUndefined()
  })
})
