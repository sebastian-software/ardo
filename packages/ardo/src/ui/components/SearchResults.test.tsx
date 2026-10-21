import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { defaultArdoLabels } from "../labels"
import { getSearchResultContext, type SearchMatch, SearchResults } from "./SearchResults"

describe("SearchResults", () => {
  it("renders the empty state outside the live status node", () => {
    const view = renderToStaticMarkup(
      <SearchResults
        getOptionId={(id) => id}
        labels={defaultArdoLabels.search}
        listboxId="search-results"
        onClose={() => void 0}
        query="missing"
        results={[]}
        selectedIndex={0}
      />
    )

    expect(view).toContain('role="status"')
    expect(view).toContain('aria-live="polite"')
    expect(view).toContain('role="listbox"')
    expect(view).toContain("No results found for &quot;missing&quot;")
    expect(view).not.toContain('role="listbox" aria-label="Search results"><div')
  })

  it("names the page of a heading result and shows a short excerpt", () => {
    const result: SearchMatch = {
      id: "api/defineconfig#parameters",
      title: "Parameters",
      pageTitle: "defineConfig",
      section: "API Reference",
      path: "/api-reference/functions/defineconfig#parameters",
      excerpt: `config ArdoConfig Yes ${"word ".repeat(60)}`,
    }
    const view = renderToStaticMarkup(
      <SearchResults
        getOptionId={(id) => id}
        labels={defaultArdoLabels.search}
        listboxId="search-results"
        onClose={() => void 0}
        query="param"
        results={[result]}
        selectedIndex={0}
      />
    )

    expect(view).toContain("defineConfig · API Reference")
    expect(view).toContain("config ArdoConfig Yes word")
    expect(view).toContain("…")
    expect(view).not.toContain("word ".repeat(40))
  })

  it("leaves the page title out when the result is the page itself", () => {
    expect(
      getSearchResultContext({ id: "a", title: "Guide", pageTitle: "Guide", path: "/guide" })
    ).toBeUndefined()
  })
})
