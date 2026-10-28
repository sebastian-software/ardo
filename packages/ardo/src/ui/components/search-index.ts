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

const searchIndexes = new Map<string, Promise<MiniSearch<SearchDoc>>>()

/** Load search on demand, allowing another attempt after a failed request. */
export function loadSearchIndex(locale = ""): Promise<MiniSearch<SearchDoc>> {
  const cached = searchIndexes.get(locale)
  if (cached != null) return cached
  const searchIndex = Promise.all([import("minisearch"), import("virtual:ardo/search-loaders")])
    .then(async ([{ default: SearchEngine }, { default: loaders }]) => {
      const loader = loaders[locale] ?? loaders[""]
      if (loader == null) throw new Error(`No search index for locale: ${locale}`)
      const { default: docs } = await loader()
      const index = new SearchEngine<SearchDoc>({
        fields: ["title", "content", "section"],
        storeFields: ["title", "pageTitle", "excerpt", "path", "section"],
        searchOptions: { boost: { title: 2 }, fuzzy: 0.2, prefix: true },
      })
      index.addAll(docs)
      return index
    })
    .catch((error: unknown) => {
      searchIndexes.delete(locale)
      throw error
    })
  searchIndexes.set(locale, searchIndex)
  return searchIndex
}
