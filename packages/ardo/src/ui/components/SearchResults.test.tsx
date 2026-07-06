import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { defaultArdoLabels } from "../labels"
import { SearchResults } from "./SearchResults"

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
})
