import type MiniSearch from "minisearch"

type SearchDoc = {
  id: string
  title: string
  pageTitle: string
  content: string
  excerpt: string
  path: string
  section?: string
}

let searchIndex: Promise<MiniSearch<SearchDoc>> | undefined

/** Load search on demand, allowing another attempt after a failed request. */
export function loadSearchIndex(): Promise<MiniSearch<SearchDoc>> {
  searchIndex ??= Promise.all([import("minisearch"), import("virtual:ardo/search-index")])
    .then(([{ default: SearchEngine }, { default: docs }]) => {
      const index = new SearchEngine<SearchDoc>({
        fields: ["title", "content", "section"],
        storeFields: ["title", "pageTitle", "excerpt", "path", "section"],
        searchOptions: { boost: { title: 2 }, fuzzy: 0.2, prefix: true },
      })
      index.addAll(docs)
      return index
    })
    .catch((error: unknown) => {
      searchIndex = undefined
      throw error
    })
  return searchIndex
}
