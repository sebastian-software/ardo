import { describe, expect, it } from "vitest"

import { resolveArdoLabels } from "./labels"

describe("resolveArdoLabels", () => {
  it("keeps English defaults when no overrides are provided", () => {
    const labels = resolveArdoLabels(undefined)

    expect(labels.search.placeholder).toBe("Search...")
    expect(labels.search.noResults("api")).toBe('No results found for "api"')
    expect(labels.toc.label).toBe("On this page")
  })

  it("merges nested overrides without dropping sibling defaults", () => {
    const labels = resolveArdoLabels({
      search: {
        placeholder: "Suchen...",
        noResults: (query) => `Keine Treffer fur ${query}`,
      },
      toc: {
        label: "Auf dieser Seite",
      },
    })

    expect(labels.search.placeholder).toBe("Suchen...")
    expect(labels.search.noResults("api")).toBe("Keine Treffer fur api")
    expect(labels.search.clear).toBe("Clear search")
    expect(labels.toc.label).toBe("Auf dieser Seite")
    expect(labels.toc.navLabel).toBe("Table of contents")
  })

  it("provides English defaults for the page action labels", () => {
    const labels = resolveArdoLabels(undefined)

    expect(labels.page.copyMarkdown).toBe("Copy page")
    expect(labels.page.viewMarkdown).toBe("View as Markdown")
    expect(labels.page.copyMarkdownFailed).toBe(
      "Copying failed. Open the Markdown version instead."
    )
  })

  it("merges page action overrides without dropping the other page labels", () => {
    const labels = resolveArdoLabels({
      page: { copyMarkdown: "Seite kopieren" },
    })

    expect(labels.page.copyMarkdown).toBe("Seite kopieren")
    expect(labels.page.viewMarkdown).toBe("View as Markdown")
    expect(labels.page.edit).toBe("Edit this page")
  })
})
