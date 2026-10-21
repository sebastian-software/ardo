import MiniSearch from "minisearch"
import { createElement } from "react"
import { renderToString } from "react-dom/server"
import { MemoryRouter } from "react-router"
import { afterEach, describe, expect, it, vi } from "vitest"

import { ArdoSearch } from "./Search"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("ArdoSearch server rendering", () => {
  it("renders the input without building the search index", () => {
    const addAll = vi.spyOn(MiniSearch.prototype, "addAll")
    const html = renderToString(createElement(MemoryRouter, null, createElement(ArdoSearch)))

    expect(html).toContain("<input")
    expect(addAll).not.toHaveBeenCalled()
  })
})
