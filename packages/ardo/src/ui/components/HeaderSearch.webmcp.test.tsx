// @vitest-environment jsdom

import { render, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ArdoPageProvider } from "../../runtime/page"
import { ArdoHeaderSearch } from "./HeaderSearch"
import type { ModelContext } from "./search-webmcp"

const registerSearchWebMcp = vi.fn()

vi.mock("./search-webmcp", () => ({
  registerSearchWebMcp: (...args: unknown[]) => registerSearchWebMcp(...args),
}))

function setModelContext(value: unknown) {
  Object.defineProperty(document, "modelContext", { value, configurable: true })
}

function renderHeaderSearch() {
  return render(
    <ArdoPageProvider>
      <ArdoHeaderSearch />
    </ArdoPageProvider>
  )
}

describe("ArdoHeaderSearch WebMCP wiring", () => {
  afterEach(() => {
    registerSearchWebMcp.mockReset()
    setModelContext(undefined)
  })

  it("registers the search tool when the API exists and skips it otherwise", async () => {
    const withoutApi = renderHeaderSearch()
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0)
    })
    expect(registerSearchWebMcp).not.toHaveBeenCalled()
    withoutApi.unmount()

    const context: ModelContext = { registerTool: vi.fn() }
    setModelContext(context)
    const withApi = renderHeaderSearch()
    await waitFor(() => expect(registerSearchWebMcp).toHaveBeenCalledTimes(1))
    expect(registerSearchWebMcp.mock.calls[0]?.[0]).toBe(context)
    withApi.unmount()
  })

  it("aborts the registration on unmount", async () => {
    setModelContext({ registerTool: vi.fn() })
    const { unmount } = renderHeaderSearch()
    await waitFor(() => expect(registerSearchWebMcp).toHaveBeenCalledTimes(1))
    const signal = registerSearchWebMcp.mock.calls[0]?.[2] as AbortSignal

    unmount()

    expect(signal.aborted).toBe(true)
  })
})
